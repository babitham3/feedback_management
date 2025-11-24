import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function Register() {
  const { register } = useContext(AuthContext);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      alert("Registered — please login");
      navigate("/login");
    } catch (err) {
      alert(JSON.stringify(err.response?.data || err));
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Register</h2>
      <input className="w-full p-2 border rounded mb-2" placeholder="username" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
      <input className="w-full p-2 border rounded mb-2" placeholder="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
      <input className="w-full p-2 border rounded mb-4" type="password" placeholder="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
      <button className="bg-green-600 text-white px-4 py-2 rounded">Register</button>
    </form>
  );
}
