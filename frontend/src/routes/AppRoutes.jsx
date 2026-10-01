import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Chat from "../pages/Chat";


const AppRoutes = () => {
  return (
    <Routes>
        <Route path="/" element ={<Home/>}/>
        <Route path="/chat" element ={<Chat/>}/>
    </Routes>
  )
}

export default AppRoutes