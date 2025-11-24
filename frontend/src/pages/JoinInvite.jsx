// src/pages/JoinInvite.jsx
import React, { useEffect, useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";

export default function JoinInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [status, setStatus] = useState("loading"); // loading, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing invite token.");
      return;
    }

    async function acceptInvite() {
      try {
        const res = await api.post(`/invites/${token}/accept/`);
        setStatus("success");
        setMessage(res.data.detail || "Joined board successfully.");
        // optionally redirect to the board page
        const boardId = res.data.board?.id;
        setTimeout(() => {
          if (boardId) navigate(`/boards/${boardId}`);
          else navigate("/");
        }, 1200);
      } catch (err) {
        setStatus("error");
        setMessage(err.response?.data?.detail || "Failed to accept invite.");
      }
    }

    // If logged in, accept immediately
    if (user) {
      acceptInvite();
    } else {
      // not logged in: save token and redirect to login
      localStorage.setItem("pending_invite_token", token);
      navigate("/login", { state: { next: `/join/${token}` } });
    }
  }, [token, user, navigate]);

  return (
    <div className="max-w-md mx-auto mt-12 p-6 border rounded">
      <h2 className="text-xl font-semibold mb-4">Join by invite</h2>
      {status === "loading" && <p>Processing invite...</p>}
      {status === "success" && <p className="text-green-600">{message}</p>}
      {status === "error" && <p className="text-red-600">{message}</p>}
    </div>
  );
}
