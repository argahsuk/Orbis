"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LogOut, LogIn, Bell, Trash2 } from "lucide-react";
import Image from "next/image";
export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navRef = useRef(null);

  useEffect(() => setMounted(true), []);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (navRef.current && !navRef.current.contains(event.target)) {
      setMobileOpen(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          setUser(data );
          fetchNotifications();
        }
      } catch {
        setUser(null);
      }
    }

    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
           const data = await res.json();
           setNotifications(data);
           setUnreadCount(data.filter(n => !n.read).length);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    }

    setMobileOpen(false);
    fetchUser();
  }, [pathname]);

  const markAllAsRead = async () => {
     try {
        const res = await fetch("/api/notifications", {
           method: "PUT",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ markAllRead: true })
        });
        if (res.ok) {
           setNotifications(notifications.map(n => ({ ...n, read: true })));
           setUnreadCount(0);
        }
     } catch (err) {
        console.error("Failed to mark notifications as read", err);
     }
  };

  const handleNotificationAction = async (notif, action) => {
     try {
         // Assuming project ID and senderId are available on the notification
         const res = await fetch(`/api/projects/${notif.projectId}/requests/${notif._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: action, isFromNotification: true, senderId: notif.senderId?._id || notif.senderId })
         });
         
         if (res.ok) {
            // Mark notification as read and remove action buttons
            const updateRes = await fetch("/api/notifications", {
               method: "PUT",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ notificationId: notif._id })
            });

            if(updateRes.ok) {
               setNotifications(notifications.map(n => n._id === notif._id ? { ...n, read: true, type: "system", message: `Request ${action}ed successfully.` } : n));
               setUnreadCount(prev => Math.max(0, prev - 1));
            }
         }
     } catch (err) {
         console.error(`Failed to ${action} request`, err);
     }
  };

  const handleDeleteNotification = async (id) => {
     try {
        const res = await fetch(`/api/notifications?id=${id}`, {
           method: "DELETE",
        });
        if (res.ok) {
           setNotifications(prev => prev.filter(n => n._id !== id));
           setUnreadCount(prev => notifications.find(n => n._id === id && !n.read) ? Math.max(0, prev - 1) : prev);
        }
     } catch (err) {
        console.error("Failed to delete notification", err);
     }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
    router.push("/login");
  };

  if (!mounted) return null;

  const isLight = theme === "light";

  const navClass = (path) =>
    `relative px-1 py-0.5 transition ${
      pathname === path
        ? "text-black dark:text-white font-semibold"
        : "text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white"
    }`;

  return (
    <header className="sticky top-4 z-50 w-full">
      <div className="mx-auto mt-2 max-w-7xl px-4">
        <div
          className="flex h-14 items-center justify-between rounded-full 
bg-white/70 dark:bg-black/80 
border border-zinc-200 dark:border-white/10 
backdrop-blur-md px-6"
        >
          <Link
            href="/"
            className="font-extrabold text-sm justify-center items-center text-black flex gap-2 dark:text-white"
          >
            <Image
              src={"/logo.png"}
              alt="Logo"
              width={24}
              height={24}
              className="block "
            />
            Orbis
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-8 text-sm">
              {[
                { name: "Dashboard", path: "/dashboard" },
                { name: "Projects", path: "/projects" },
                { name: "Create Project", path: "/projects/create" },
              ].map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={navClass(link.path)}
                >
                  <span className="relative group">
                    {link.name}
                    <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-current transition-all group-hover:w-full"></span>
                  </span>
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-4">
            <label className="relative inline-block w-[4em] h-[2.2em] rounded-[30px] shadow-md">
              <input
                type="checkbox"
                className="opacity-0 w-0 h-0"
                checked={isLight}
                onChange={() => setTheme(isLight ? "dark" : "light")}
              />
              <span
                className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-[30px] overflow-hidden transition-colors duration-400"
                style={{ backgroundColor: isLight ? "#00a6ff" : "#2a2a2a" }}
              >
                <div
                  className={`absolute bg-white rounded-full w-[5px] h-[5px] transition-all duration-400 left-[2.5em] top-[0.5em] ${isLight ? "opacity-0" : "opacity-100"}`}
                ></div>
                <div
                  className={`absolute bg-white rounded-full w-[5px] h-[5px] transition-all duration-400 left-[2.2em] top-[1.2em] ${isLight ? "opacity-0" : "opacity-100"}`}
                ></div>
                <div
                  className={`absolute bg-white rounded-full w-[5px] h-[5px] transition-all duration-400 left-[3em] top-[0.9em] ${isLight ? "opacity-0" : "opacity-100"}`}
                ></div>

                <svg
                  viewBox="0 0 16 16"
                  className={`absolute w-[3.5em] bottom-[-1.4em] left-[-1.1em] transition-all duration-400 fill-white ${isLight ? "opacity-100" : "opacity-0"}`}
                >
                  <path
                    transform="matrix(.77976 0 0 .78395-299.99-418.63)"
                    d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925"
                  ></path>
                </svg>
                <div
                  className="absolute h-[1.2em] w-[1.2em] rounded-[20px] left-[0.5em] bottom-[0.5em] transition-all duration-400 ease-[cubic-bezier(0.81,-0.04,0.38,1.5)]"
                  style={{
                    transform: isLight ? "translateX(1.8em)" : "translateX(0)",
                    boxShadow: isLight
                      ? "inset 0.88em -0.23em 0px 0.88em #ffcf48"
                      : "inset 0.47em -0.23em 0px 0px #fff",
                  }}
                ></div>
              </span>
            </label>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                    <Bell className="size-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-black animate-pulse"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
                   <div className="flex items-center justify-between px-2 py-2">
                      <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
                      {unreadCount > 0 && (
                         <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-1 text-xs text-primary">
                            Mark all as read
                         </Button>
                      )}
                   </div>
                   <DropdownMenuSeparator />
                   {notifications.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">No new notifications</div>
                   ) : (
                      notifications.map(notif => (
                         <DropdownMenuItem key={notif._id} asChild className="p-0 cursor-default">
                            <div className={`relative flex flex-col items-start p-3 gap-2 w-full ${!notif.read ? "bg-primary/5 border-l-2 border-primary" : ""}`}>
                               <div className="flex flex-col items-start gap-1 w-full pr-8">
                                  {notif.senderId && (
                                     <Link 
                                        href={`/profile/${notif.senderId._id || notif.senderId}`} 
                                        className="flex items-center gap-2 mb-1 hover:underline"
                                     >
                                        <Avatar className="size-5">
                                           <AvatarFallback className="text-[10px] bg-secondary/80">
                                              {notif.senderId.username?.charAt(0)?.toUpperCase() || "U"}
                                           </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-semibold text-primary">{notif.senderId.username || notif.senderId.name}</span>
                                     </Link>
                                  )}
                                  <span className="text-sm font-medium leading-none">{notif.message}</span>
                                  <span className="text-xs text-muted-foreground">{new Date(notif.createdAt).toLocaleDateString()}</span>
                               </div>
                               
                               <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-destructive z-10"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteNotification(notif._id); }}
                               >
                                  <Trash2 className="size-4" />
                               </Button>
                               
                               {notif.type === "new_request" && !notif.read && (
                                  <div className="flex gap-2 w-full mt-2">
                                     <Button 
                                        size="sm" 
                                        className="h-7 text-xs flex-1 z-10" 
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleNotificationAction(notif, "accept"); }}
                                     >
                                        Accept
                                     </Button>
                                     <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="h-7 text-xs flex-1 border-destructive text-destructive hover:bg-destructive/10 z-10"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleNotificationAction(notif, "reject"); }}
                                     >
                                        Decline
                                     </Button>
                                  </div>
                               )}
                            </div>
                         </DropdownMenuItem>
                      ))
                   )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-zinc-200 dark:border-zinc-700 rounded-full px-4 hover:bg-black/5 dark:hover:bg-white/10 transition"
                >
                  <Avatar className="size-7">
                    <AvatarImage src={user?.avatar || null} />
                    <AvatarFallback className="text-xs font-bold">
                      {user ? user?.username.charAt(0)?.toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium">
                    {user ? user?.username.split(" ")[0] : "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                {user ? (
                  <>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${user._id}`}>Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/projects/create">Create Project</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive cursor-pointer"
                    >
                      <LogOut className="size-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/login">
                      <LogIn className="size-4 mr-2" /> Login
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
     {user && (
  <div ref={navRef} className="md:hidden relative">


    <label className="cursor-pointer text-black dark:text-white text-[12px] h-[3em] flex items-center">
      <input
        type="checkbox"
        checked={mobileOpen}
        onChange={() => setMobileOpen(!mobileOpen)}
        className="hidden"
      />
      <svg
        viewBox="0 0 32 32"
        className={`h-[3em] transition-transform duration-600 ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileOpen ? "-rotate-45" : ""}`}
      >
        <path
          className="fill-none stroke-current stroke-linecap-round stroke-linejoin-round stroke-[2] transition-[stroke-dasharray,stroke-dashoffset] duration-600 ease-[cubic-bezier(0.4,0,0.2,1)]"
          d="M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22"
          style={{
            strokeDasharray: mobileOpen ? "20 300" : "12 63",
            strokeDashoffset: mobileOpen ? "-32.42" : "0",
          }}
        />
        <path
          className="fill-none stroke-current stroke-linecap-round stroke-linejoin-round stroke-[2]"
          d="M7 16 27 16"
        />
      </svg>
    </label>

    
    <div
      className={`absolute right-0 mt-3 w-52 rounded-2xl 
      bg-white/90 dark:bg-black/90 
      border border-zinc-200 dark:border-white/20 
      backdrop-blur-md 
      transition-all duration-300 ease-in-out overflow-hidden 
      ${mobileOpen ? "max-h-60 opacity-100 py-6" : "max-h-0 opacity-0"}`}
    >
      <div className="flex flex-col items-center gap-6 text-black dark:text-white text-sm font-medium">
        {[
          { name: "Dashboard", path: "/dashboard" },
          { name: "Projects", path: "/projects" },
          { name: "Create Project", path: "/projects/create" },
        ].map((link) => (
          <Link
            key={link.path}
            href={link.path}
            onClick={() => setMobileOpen(false)}
          >
           <span className="relative group">
                    {link.name}
                    <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-current transition-all group-hover:w-full"></span>
                  </span>
          </Link>
        ))}
      </div>
    </div>

  </div>
)}
          </div>
        </div>
      </div>
    </header>
  );
}
