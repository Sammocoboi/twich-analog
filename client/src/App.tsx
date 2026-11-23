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
if (token && user) return(
  <div>
    <h1>ты в системе</h1>
    <p>id:{user.id}</p>
    <p>email: {user.email}</p>
    <button onClick={logout}>выйти</button>
  </div>
)



  return (
    <>
      <form action="" onSubmit={submit}>
        <h1>STREAM пупа залупа</h1>
        <div>
          <button type='button' className={mode === "login" ? "active": ""} onClick={()=>{setMode('login');setError("");setNotice("")}}>
            вход
          </button>
          <button type='button' className={mode === "register" ? "active": ""} onClick={()=>{setMode('register');setError("");setNotice("")}}>регистрация</button>


        </div>
        <label htmlFor="">Email</label>
        <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} placeholder='введите email'/>
        <input type="password" required minLength={8} value={password} onChange={(e)=>setPassword(e.target.value)} placeholder='введите пароль'/>
        <button className='submit' disabled={busy}> {busy ? "подожди":mode==="login" ? "войти":"создать аккаунт"}</button>
        {error && <div>{error}</div>}
        {notice && !error && <div>{notice}</div>}

        
      </form>
    </>
  )
}

export default App
