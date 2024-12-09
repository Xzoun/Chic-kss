import { useNavigate } from "react-router-dom";
import { useSwipeable } from "react-swipeable";

export function SettingsView() {
    const navigate = useNavigate();

    const handlerView = useSwipeable({
        onSwipedRight: () => navigate("/inbox"),
    });

    return (
        <div className='back'{...handlerView}>
            <div className='layout'>
                <h1>Ajustes</h1>
            </div>
        </div>
    )
}