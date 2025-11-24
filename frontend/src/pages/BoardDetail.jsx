import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import api from "../api/api";
import { AuthContext } from "../contexts/AuthContext";

export default function BoardDetail(){
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    api.get(`/board/${id}/`).then(res => setBoard(res.data)).catch(() => setBoard(null));
  }, [id]);

  if (!board) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl">{board.name}</h2>
      <p>{board.description}</p>
      <p className="text-sm mt-2">Visibility: {board.is_public ? "Public" : "Private"}</p>
      {user ? <p className="mt-3">You are logged in as {user.username}</p> : <p className="mt-3">Login to interact</p>}
    </div>
  );
}