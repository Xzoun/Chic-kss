import { useEffect, useState } from "react";
import { getAllDesignPhotos, getAllEvents, readURLImg, deletePhoto as deletePhotoDB } from "../../firebase/firebaseStorage";
import { Loading } from "../Loading";
import toast, { Toaster } from "react-hot-toast";
import { toastOptions } from "../specialFunctions";
import { deletePhoto, readEvent, readUser, } from "../../firebase/firebaseDatabase";
import { useSwipeable } from "react-swipeable";

export function ReportsList() {
    const [design, setDesign] = useState(null);
    const [state, setState] = useState(0);
    const [reports, setReports] = useState(null);
    const [reLoad, setReLoad] = useState(null);

    useEffect(() => {
        const fetchDesign = async () => {
            const fotos = await getAllDesignPhotos();
            setDesign(fotos);
        }

        fetchDesign();
    }, []);

    useEffect(() => {

        const fetchReports = async () => {
            try {
                const fetchedEvents = await getAllEvents();

                const eventsInfo = await Promise.all(fetchedEvents.map(async uid => {

                    const eventData = await readEvent(uid);
                    if (eventData) {
                        const fotos = eventData.fotos || [];
                        const reportPromises = fotos.map(async foto => {
                            if (foto.reports && foto.reports.length > 0) {

                                const userInfo = await readUser(foto.codigoUsuario);

                                const usersInfoPromises = foto.reports.map(async userUid => {
                                    const userReportingInfo = await readUser(userUid);
                                    return userReportingInfo;
                                });

                                const usersInfo = await Promise.all(usersInfoPromises);

                                const route = `events/${uid}/${foto.uid}`;
                                const imgUrl = await readURLImg(route);

                                const reportData = {
                                    uid: foto.uid,
                                    eventUid: parseInt(foto.eventUid),
                                    likes: foto.likes.length,
                                    user: userInfo,
                                    event: eventData.name,
                                    photoUrl: imgUrl,
                                    users: usersInfo,
                                    reports: foto.reports.length
                                };

                                return reportData;
                            }
                        });
                        return Promise.all(reportPromises);
                    }
                }));

                const allReports = eventsInfo.flat().filter(report => report !== undefined);

                setReports(allReports);

            } catch (error) {
                console.error('Error fetching reports:', error);
            }
        }

        fetchReports();
    }, [reLoad]);

    const handleState = () => {
        if (state === 1) {
            setState(0);
        } else {
            if (reports) {
                setState(1);

            } else {
                toast.success("No se registran fotos reportadas", { duration: 2000 });
            }
        }
    }

    const handlersView = useSwipeable({
        onSwipedRight: () => setState(0)
    });

    const handleDeletePhoto = async (index) => {
        try {
            const confirmDelete = window.confirm("\n     ¿Eliminamos la foto?\n\n ⛔ Esta acción no se puede deshacer. ⛔");

            if (confirmDelete) {
                try {
                    await deletePhoto(reports[index].eventUid, reports[index].uid);
                    await deletePhotoDB(`events/${reports[index].eventUid}/${reports[index].uid}`);
                    reports.splice(index, 1);

                    let timer;
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        setReLoad(prevCount => prevCount + 1);
                        toast.success("Foto eliminada correctamente", { duration: 2000 });
                    }, 2000);

                } catch (error) {
                    toast.error("Error al eliminar la foto", { duration: 2000 });
                    console.error("Error en handleDeletePhoto:", error);
                }
            }

        } catch (error) {
            console.error("Error en handleDeletePhoto:", error);
        }
    }

    if (!design || !reports) {
        return (
            <>
                <Loading />
            </>
        )
    }

    return (
        <div {...handlersView}>
            <Toaster containerStyle={{ position: 'fixed', top: '11vh', right: '2vw', zIndex: '9999' }}  {...toastOptions()} reverseOrder={true} />
            <div>
                <button type="submit" className="reportsBtn" onClick={() => { handleState() }}><img alt="Crear Álbum" src={design["report"].url} className="icon" /></button>
            </div>

            {state === 1 ? (<>
                <div className="reportsBack">

                    {reports.map((report, index) => (
                        <div key={index} className="reportedFoto">
                            <img src={report.photoUrl} alt={`Foto ${index}`} className="photoReported" />

                            <div className="reportInfo">
                                <div className="ReportInfoGeneral">
                                    <div className="userReported">
                                        <img className="userReportedPhoto" src={report.user.photoURL} alt={`Foto de perfil de${report.user.display}`} />
                                        <div className="bannDiv">
                                            <h3>{report.user.displayName}</h3>
                                            <button className="bannBtn" onClick={() => { handleDeletePhoto(index) }}>
                                                <img className="bannIcon" src={design["judge"].url} alt="Bannear Icon" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="bold">{report.event}</p>
                                    {report.reports > 1 ?
                                        <p>{report.reports} Reportes</p>
                                        : <p>{report.reports} Reporte</p>
                                    }
                                    {report.likes > 1 ?
                                        <p>{report.likes} Likes</p>
                                        : <p>{report.likes} Like</p>
                                    }
                                </div>
                                <div className="usersReporting">
                                    {report.users ? (<>
                                        <h4>Reportada por</h4>
                                        {report.users.map((user, idx) => (
                                            <div key={idx}>
                                                <p>{user.displayName}</p>
                                            </div>
                                        )
                                        )}</>) : null}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>
            </>) : null
            }
        </div>
    )
}