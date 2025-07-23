'use client';
import React from "react";
import { useFocusAFKStore } from "../../store/store";
import styles from "../../styles/components/navigation.module.scss";
import { useUIStore } from "../../store/uiStore";
import ProfileUser from "../profile/ProfileUser";
import { Icon } from "../small/icons";
import Link from "next/link";
import ToggleTheme from "./ToggleTheme";

const Navbar = () => {
  const { setTheme, ui } = useFocusAFKStore();

  const { showModal } = useUIStore();
  const toggleTheme = () => {
    const newTheme = ui.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    if (typeof window !== "undefined") {
      const body = document.body;
      body.setAttribute("data-theme", newTheme);
    }
  };

  return (
    <nav className={styles.navbar}>
      {/* Brand */}
      <div className={styles.navbarBrand}>
        <Link href="/" className="flex flex-row items-center justify-center cursor-pointer">
          <h1 className={styles.navbarTitle}>
            Focus AFK
          </h1>
        </Link>
      </div>

      {/* Actions */}
      <div className={styles.navbarActions}>
        <button onClick={() => showModal(<ProfileUser />)}> <Icon name="user" /> </button>

        <ToggleTheme />
      </div>
    </nav>
  );
};

export default Navbar; 