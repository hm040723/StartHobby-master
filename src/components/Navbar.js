import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { CgProfile } from 'react-icons/cg'; 
import { FaShoppingCart, FaPowerOff } from "react-icons/fa";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import { useAuth } from "../context/AuthContext"; // This will now get the Firebase user
import ConfirmModal from "../components/ConfirmModal";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, logout } = useAuth(); // 'user' is now the Firebase auth user object
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const confirmLogout = () => {
    setIsModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout(); // This now calls Firebase's signOut
      setIsModalOpen(false);
      navigate("/"); // Navigate after successful logout
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <>
      <nav className="navbar">
        {/* Left side: Logo */}
        <div className="navbar-left">
          <Link to="/" className="logo-link">
            <img src="/Logos-01.png" alt="Logo" />
          </Link>
        </div>

        {/* Hamburger icon for small screens */}
        <div className="hamburger" onClick={toggleMenu}>
          {menuOpen ? <IoClose size={28} /> : <GiHamburgerMenu size={28} />}
        </div>

      <ul className={`navbar-links ${menuOpen ? "open" : ""}`}>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/twister">Twister</Link></li>
          <li className="dropdown">
            <span className="dropbtn">Explore ▾</span>
            <div className="dropdown-content">
              <Link to="/blog">Blog</Link>
              <Link to="/daily-note">Daily Note</Link>
            </div>
          </li>
        <li><Link to="/corporate">For Corporate</Link></li>
        <li><Link to="/hobby-providers">Hobby Providers</Link></li>
        <li><Link to="/shop">Shop</Link></li>
      </ul>

        {/* Right side: Profile section */}
        <div className={`navbar-profile ${menuOpen ? "open" : ""}`}>
          {user ? (
            // ---- USER IS LOGGED IN ----
            <>
              <Link to="/profile" className="profile-link">
                {/* ---  Use user.displayName for the name --- */}
                <span>{user.displayName}</span>
              </Link>
              <Link to="/cart" className="cart-link">
                <FaShoppingCart size={20} />
              </Link>
              <FaPowerOff onClick={confirmLogout} className="logout-button" />
            </>
          ) : (
            // ---- USER IS LOGGED OUT ----
            <Link to="/signup" className="profile-link">
              <CgProfile size={20} />
              <span>Login</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Conditionally render the modal */}
      {isModalOpen && (
        <ConfirmModal
          title="Confirm Logout"
          onConfirm={handleLogout}
          onCancel={() => setIsModalOpen(false)}
        >
          <p>Are you sure you want to log out?</p>
        </ConfirmModal>
      )}
    </>
  );
}

export default Navbar;