import React, { useEffect, useState } from 'react'
import { login,me,register,type User } from './api'
import './App.css'

type Mode = "login" | "register"

function App() {
const [mode,setMode] = useState<Mode>("login")
const [email,setEmail] = useState("")
const [password,setPassword] = useState("")
const [token,setToken] =useState<string | null>(() => localStorage.getItem("token"))
const [user,setUser] = useState<User | null>(null)
const [error,setError] =useState("")
const [notice,setNotice] = useState("")
const [busy,setBusy] =useState(false)

// если есть сохраненые токены проверяем их через /me
useEffect(() => {
  if (!token) {setUser(null);return}
  me()
  .then(setUser)
  .catch(() => {localStorage.removeItem('token');setToken(null);});

},[token])

const submit = async(e:React.FormEvent) =>{
  e.preventDefault();
  setError("");setNotice("");setBusy(true);
  try {
    if (mode === "register") {
      await register(email,password);
      setNotice("Аккаунт создан входим")
    }
    const {access_token} = await login(email,password)
    localStorage.setItem("token",access_token);
    setToken(access_token);
  } catch ( err ){
    setError(err instanceof Error ? err.message:"случислоась какаято хуйня")
  } finally {
    setBusy(false)
  }
}

const logout = () => {
  localStorage.removeItem("token");
  setToken(null);setUser(null),setPassword("");
}

if (token && !user) return <div>Проверяем токен что вы не долбач</div>




  return (
    <>
    </>
  )
}

export default App
