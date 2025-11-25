import { signIn, logOut } from "../firebase";
import { useAuth } from "../AuthContext";

function AuthBar() {
  const { user } = useAuth();

  return (
    <div style={{ padding: "12px", borderBottom: "1px solid #ddd" }}>
      {user ? (
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <img 
            src={user.photoURL} 
            alt="" 
            style={{ width: 34, height: 34, borderRadius: "50%" }} 
          />
          <span>{user.displayName}</span>
          <button onClick={logOut}>Logout</button>
        </div>
      ) : (
        <button onClick={signIn}>Login with Google</button>
      )}
    </div>
  );
}

export default AuthBar;
