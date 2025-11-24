import React, {useContext} from "react";
import { Routes,Route,Link} from "react-router-dom";
import Boards from "./pages/Boards";
import BoardDetail from "./pages/BoardDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import JoinInvite from "./pages/JoinInvite";
import AdminRequests from "./pages/AdminRequests";
import CreateBoard from "./pages/CreateBoard";
import BoardInvitesPage from "./pages/BoardInvitesPage";
import BoardMembershipRequestsPage from "./pages/BoardMembershipRequestsPage";
import { AuthContext } from "./contexts/AuthContext";


export default function App() {
  const {user,logout} = useContext(AuthContext);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <Link to="/" className="text-xl font-semibold">Feedback App</Link>
        <div>
          {user ? (
            <>
            <span className="mr-4">Hello, {user.username}</span>
            <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={()=> logout()}>Logout</button>
            </>
          ) : (
            <>
            <Link to="/login" className="mr-4">Login</Link>
            <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Boards />} />
        <Route path="/boards/:id" element={<BoardDetail />} />
        <Route path="/join/:token" element={<JoinInvite />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/requests" element={<AdminRequests />} />
        <Route path="/boards/create" element={<CreateBoard />} />
        <Route path="/boards/:id/invites" element={<BoardInvitesPage />} />
<Route path="/boards/:id/requests" element={<BoardMembershipRequestsPage />} />
      </Routes>
    </div>
  );
}