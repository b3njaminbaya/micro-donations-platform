import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function UserLayout() {
    return (
        <div className="min-h-screen bg-paper-alt">
            <Sidebar />
            <main className="md:ml-72 px-4 py-8 sm:px-6 md:px-10 md:py-10 max-w-6xl">
                <Outlet />
            </main>
        </div>
    );
}

export default UserLayout;
