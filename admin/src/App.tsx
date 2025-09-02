import { Link } from 'react-router-dom'

export default function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Rezom Admin</h1>
      <p>관리자 도구</p>
      <ul>
        <li><Link to="/login">로그인</Link></li>
        <li><Link to="/suggestions?slug=language-definition">제안 승인</Link></li>
      </ul>
    </div>
  )
}