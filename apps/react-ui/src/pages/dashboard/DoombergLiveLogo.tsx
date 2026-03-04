import styles from "./DoombergLiveLogo.module.css";

const DoombergLiveLogo: React.FC = () => {

 return (
   <div className={styles.logoContainer}>
     {/* <img src="/doomberglive_logo.png" alt="Doomberg Live Logo" className="w-8 h-8" /> */}
     <div className={styles.doomBerg}>DoomBerg</div>
     <div className={styles.doomLive}>Live</div>
   </div>
 );
}

export default DoombergLiveLogo;