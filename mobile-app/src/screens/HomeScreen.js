import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = [
  { name: 'Feed', value: 'all' },
  { name: 'Politics', value: 'politics' },
  { name: 'Business', value: 'business' },
  { name: 'World News', value: 'world news' },
  { name: 'Legal', value: 'legal' },
  { name: 'Miscellaneous', value: 'miscellaneous' },
];

// Mock articles for testing
const MOCK_ARTICLES = [
  {
    _id: '1',
    title: 'Breaking: Major Political Development',
    summary: 'This is a sample news article about recent political developments that have significant impact on the current situation.',
    category: 'politics',
    imageUrl: 'https://via.placeholder.com/300x200/1e3c72/ffffff?text=Politics',
  },
  {
    _id: '2',
    title: 'Business Markets Show Strong Growth',
    summary: 'Economic indicators suggest positive trends in the business sector with increased investor confidence.',
    category: 'business',
    imageUrl: 'https://via.placeholder.com/300x200/2e7d32/ffffff?text=Business',
  },
  {
    _id: '3',
    title: 'World News: International Summit',
    summary: 'Leaders from around the world gather to discuss important global issues and cooperation.',
    category: 'world news',
    imageUrl: 'https://via.placeholder.com/300x200/d32f2f/ffffff?text=World',
  },
];

const HomeScreen = ({ navigation }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchArticles = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Try to fetch from API first
      try {
        const response = await fetch('https://nobiasmedia.onrender.com/api/news?page=1', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        });

        if (response.ok) {
          const data = await response.json();
          setArticles(data.articles || MOCK_ARTICLES);
        } else {
          throw new Error('API not available');
        }
      } catch (apiError) {
        console.log('Using mock data:', apiError.message);
        // Use mock data if API fails
        setArticles(MOCK_ARTICLES);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles(MOCK_ARTICLES);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchArticles(true);
  };

  const selectCategory = (category) => {
    setSelectedCategory(category);
    // Filter articles by category
    if (category === 'all') {
      setArticles(MOCK_ARTICLES);
    } else {
      const filtered = MOCK_ARTICLES.filter(article => 
        article.category.toLowerCase() === category.toLowerCase()
      );
      setArticles(filtered);
    }
  };

  const handleArticlePress = (article) => {
    navigation.navigate('ArticleDetail', { articleId: article._id });
  };

  const handleReadMore = (article) => {
    navigation.navigate('ArticleDetail', { articleId: article._id });
  };

  const renderArticle = ({ item }) => (
    <TouchableOpacity 
      style={styles.articleCard}
      onPress={() => handleArticlePress(item)}
    >
      <Image 
        source={{ uri: item.imageUrl }}
        style={styles.articleImage}
        resizeMode="cover"
      />
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{item.category?.toUpperCase()}</Text>
      </View>
      <View style={styles.articleContent}>
        <Text style={styles.articleTitle} numberOfLines={3}>
          {item.title}
        </Text>
        <Text style={styles.articleSummary} numberOfLines={4}>
          {item.summary}
        </Text>
        <View style={styles.articleButtons}>
          <TouchableOpacity 
            style={styles.readMoreButton}
            onPress={() => handleReadMore(item)}
          >
            <Text style={styles.readMoreText}>Read More</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sourcesButton}>
            <Text style={styles.sourcesText}>Sources</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryButton = (category) => (
    <TouchableOpacity
      key={category.value}
      style={[
        styles.categoryButton,
        selectedCategory === category.value && styles.selectedCategoryButton
      ]}
      onPress={() => selectCategory(category.value)}
    >
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === category.value && styles.selectedCategoryButtonText
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Categories */}
      <View style={styles.header}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
        >
          {CATEGORIES.map(renderCategoryButton)}
        </ScrollView>
      </View>

      {/* Articles List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e3c72" />
          <Text style={styles.loadingText}>Loading articles...</Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          renderItem={renderArticle}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoriesContainer: {
    paddingHorizontal: 15,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  selectedCategoryButton: {
    backgroundColor: '#1e3c72',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  selectedCategoryButtonText: {
    color: '#fff',
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
  listContainer: {
    padding: 15,
  },
  articleCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: 200,
  },
  categoryBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3c72',
  },
  articleContent: {
    padding: 15,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 24,
  },
  articleSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  articleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  readMoreButton: {
    backgroundColor: '#1e3c72',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  readMoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sourcesButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  sourcesText: {
    color: '#1e3c72',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default HomeScreen;