import s from './AboutPage.module.scss'

const AboutPage: React.FC = () => {
  return (
    <div className={`container ${s.aboutPage}`}>
      <h2>About Bitcoin LLM Commentary</h2>
      <p>
        This is the About Page of the Bitcoin LLM Commentary application. Here you can find information about the project, its goals, and the team behind it.
      </p>
    </div>
  )
}

export default AboutPage