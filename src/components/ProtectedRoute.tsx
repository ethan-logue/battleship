import { Navigate } from 'react-router-dom';
import { usePlayer} from '../utils/PlayerContext';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { player } = usePlayer();

    if (!player) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;