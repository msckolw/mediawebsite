import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const ArticleDetailScreen = ({ route, navigation }) => {
  const { articleId } = route.params;
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchArticleDetail();
  }, [articleId]);

  const fetchArticleDetail = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API
      try {
        const response = await fetch(`https://nobiasmedia.onrender.com/api/news/${articleId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        });

        if (response.ok) {
          const data = await response.json();
          setArticle(data);
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        console.log('Using mock article data:', apiError.message);
        // Mock article data
        setArticle({
          _id: articleId,
          title: 'Sample Detailed Article',
          summary: 'This is a comprehensive summary of the article that provides detailed insights into the topic being discussed.',
          content: 'This is the full content of the article. It contains detailed information about the topic, providing readers with comprehensive coverage of the subject matter. The article includes various perspectives and expert opinions to give a well-rounded view of the situation.\n\nThe content continues with more detailed analysis and information that helps readers understand the complexity of the issue. Multiple paragraphs provide in-depth coverage of different aspects of the story.\n\nFinally, the article concludes with important takeaways and implications for the future.',
          category: 'politics',
          imageUrl: 'https://via.placeholder.com/400x250/1e3c72/ffffff?text=Article+Image',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      Alert.alert('Error', 'Failed to load article. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    Alert.alert(
      isSaved ? 'Removed from Bookmarks' : 'Saved to Bookmarks',
      isSaved ? 'Article removed from your bookmarks' : 'Article saved to your bookmarks'
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${article.title}\n\n${article.summary}`,
        title: article.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleViewSources = () => {
    Alert.alert(
      'News Sources',
      'Here are all the news sources for this article. This feature shows multiple sources to help you get a complete perspective.',
      [
        { text: 'Close', style: 'cancel' }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e3c72" />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Article not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
              <Text style={[styles.actionBtnText, isSaved && styles.savedText]}>
                {isSaved ? '🔖' : '🔖'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Text style={styles.actionBtnText}>📤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Article Image */}
        <Image 
          source={{ uri: article.imageUrl }}
          style={styles.articleImage}
          resizeMode="cover"
        />

        {/* Article Content */}
        <View style={styles.content}>
          {/* Category and Date */}
          <View style={styles.metaInfo}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{article.category?.toUpperCase()}</Text>
            </View>
            <Text style={styles.dateText}>
              {new Date(article.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.summaryText}>{article.summary}</Text>
          </View>

          {/* Full Content */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Full Article</Text>
            <Text style={styles.contentText}>{article.content}</Text>
          </View>

          {/* News Sources Button */}
          <TouchableOpacity style={styles.sourcesButton} onPress={handleViewSources}>
            <Text style={styles.sourcesButtonText}>View News Sources</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#1e3c72',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: {
    padding: 5,
  },
  backBtnText: {
    fontSize: 16,
    color: '#1e3c72',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionBtn: {
    marginLeft: 15,
    padding: 5,
  },
  actionBtnText: {
    fontSize: 20,
  },
  savedText: {
    color: '#1e3c72',
  },
  articleImage: {
    width: width,
    height: 250,
  },
  content: {
    padding: 20,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryBadge: {
    backgroundColor: '#1e3c72',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 32,
    marginBottom: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  contentText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 26,
  },
  sourcesButton: {
    backgroundColor: '#1e3c72',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  sourcesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ArticleDetailScreen;