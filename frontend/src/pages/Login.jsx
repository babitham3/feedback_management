import React, {useContext,useState} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function Login() {
    const {login} = useContext(AuthContext);
    const [form,setForm]= useState({username:'',password:''});
    const navigate = useNavigate();

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(form);
            navigate('/');
        } catch(err){
            alert(err.response?.data?.detail || 'Login failed');
        }
    };

    return (
        <form onSubmit={onSubmit} className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Login</h2>
            <input className="w-full p-2 border rounded mb-2" placeholder="username" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} />
            <input className="w-full p-2 border rounded mb-4" type='password' placeholder="password" value={form.password} onChange={e=> setForm({...form,password:e.target.value})} />
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
    </form>
  );
}
