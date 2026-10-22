import { useParams } from 'react-router-dom';
import ArticleFeed from '../components/ArticleFeed';
export default function ArticleByCategory() { const { cat } = useParams(); return <ArticleFeed category={cat} />; }
