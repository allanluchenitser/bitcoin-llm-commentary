import styles from "./DoombergLiveLogo.module.css";

const DoombergLiveLogo: React.FC<{ className?: string }> = ({
  className
}) => {

 return (
   <div className={`${styles.logoContainer} ${className || ''}`}>
     <div className={styles.doomBerg}>DoomBerg</div>
     <div className={styles.doomLive}>Live</div>
   </div>
 );
}

export default DoombergLiveLogo;