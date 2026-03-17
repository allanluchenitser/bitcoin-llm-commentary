import styles from "./DoombergLiveLogo.module.css";

type DoombergLiveParams = {
  className?: string,
}

const DoombergLiveLogo = ({ className }: DoombergLiveParams) => {

 return (
   <div className={`${styles.logoContainer} ${className || ''}`}>
     <div className={styles.doomBerg}>DoomBerg</div>
     <div className={styles.doomLive}>Live</div>
   </div>
 );
}

export default DoombergLiveLogo;