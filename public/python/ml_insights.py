"""
Machine Learning Insights module for Datuum 2.0
Handles clustering, outlier detection, pattern recognition, and feature importance
"""

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import IsolationForest
from sklearn.decomposition import PCA
from sklearn.feature_selection import SelectKBest, f_regression, f_classif
from sklearn.metrics import silhouette_score
from scipy import stats
from typing import Dict, List, Any, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

class MLInsights:
    def __init__(self, data: pd.DataFrame = None):
        self.data = data
        self.scaler = StandardScaler()
        self.results = {}
    
    def set_data(self, data: pd.DataFrame):
        """Set the dataset for analysis"""
        self.data = data
    
    def detect_outliers(self, columns: List[str] = None, 
                       methods: List[str] = None) -> Dict[str, Any]:
        """
        Detect outliers using multiple methods
        
        Args:
            columns: List of columns to analyze
            methods: List of methods to use ('iqr', 'zscore', 'isolation_forest')
            
        Returns:
            Dictionary with outlier detection results
        """
        if self.data is None:
            return {'success': False, 'error': 'No data provided'}
        
        try:
            if columns is None:
                numeric_columns = self.data.select_dtypes(include=[np.number]).columns.tolist()
            else:
                numeric_columns = [col for col in columns if col in self.data.columns and 
                                 pd.api.types.is_numeric_dtype(self.data[col])]
            
            if not numeric_columns:
                return {'success': False, 'error': 'No numeric columns found'}
            
            if methods is None:
                methods = ['iqr', 'zscore', 'isolation_forest']
            
            outlier_results = {}
            
            for method in methods:
                if method == 'iqr':
                    outlier_results['iqr'] = self._detect_outliers_iqr(numeric_columns)
                elif method == 'zscore':
                    outlier_results['zscore'] = self._detect_outliers_zscore(numeric_columns)
                elif method == 'isolation_forest':
                    outlier_results['isolation_forest'] = self._detect_outliers_isolation_forest(numeric_columns)
            
            return {
                'success': True,
                'methods_used': methods,
                'outlier_results': outlier_results,
                'columns_analyzed': numeric_columns
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _detect_outliers_iqr(self, columns: List[str]) -> Dict[str, Any]:
        """Detect outliers using IQR method"""
        outliers = {}
        
        for col in columns:
            data = self.data[col].dropna()
            Q1 = data.quantile(0.25)
            Q3 = data.quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outlier_mask = (data < lower_bound) | (data > upper_bound)
            outlier_indices = data[outlier_mask].index.tolist()
            
            outliers[col] = {
                'count': len(outlier_indices),
                'percentage': len(outlier_indices) / len(data) * 100,
                'indices': outlier_indices,
                'values': data[outlier_mask].tolist(),
                'bounds': {
                    'lower': float(lower_bound),
                    'upper': float(upper_bound)
                }
            }
        
        return outliers
    
    def _detect_outliers_zscore(self, columns: List[str], threshold: float = 3) -> Dict[str, Any]:
        """Detect outliers using Z-score method"""
        outliers = {}
        
        for col in columns:
            data = self.data[col].dropna()
            z_scores = np.abs(stats.zscore(data))
            outlier_mask = z_scores > threshold
            
            outlier_indices = data[outlier_mask].index.tolist()
            
            outliers[col] = {
                'count': len(outlier_indices),
                'percentage': len(outlier_indices) / len(data) * 100,
                'indices': outlier_indices,
                'values': data[outlier_mask].tolist(),
                'z_scores': z_scores[outlier_mask].tolist(),
                'threshold': threshold
            }
        
        return outliers
    
    def _detect_outliers_isolation_forest(self, columns: List[str], 
                                        contamination: float = 0.1) -> Dict[str, Any]:
        """Detect outliers using Isolation Forest"""
        try:
            # Prepare data
            data_subset = self.data[columns].dropna()
            X = self.scaler.fit_transform(data_subset)
            
            # Fit Isolation Forest
            iso_forest = IsolationForest(contamination=contamination, random_state=42)
            outlier_labels = iso_forest.fit_predict(X)
            
            # Get outlier indices
            outlier_indices = data_subset[outlier_labels == -1].index.tolist()
            
            return {
                'count': len(outlier_indices),
                'percentage': len(outlier_indices) / len(data_subset) * 100,
                'indices': outlier_indices,
                'contamination': contamination,
                'scores': iso_forest.score_samples(X)[outlier_labels == -1].tolist()
            }
        except Exception as e:
            return {'error': str(e)}
    
    def perform_clustering(self, columns: List[str] = None, 
                          algorithm: str = 'kmeans', 
                          n_clusters: int = None) -> Dict[str, Any]:
        """
        Perform clustering analysis
        
        Args:
            columns: List of columns to use for clustering
            algorithm: Clustering algorithm ('kmeans', 'dbscan')
            n_clusters: Number of clusters (for K-means)
            
        Returns:
            Dictionary with clustering results
        """
        if self.data is None:
            return {'success': False, 'error': 'No data provided'}
        
        try:
            if columns is None:
                numeric_columns = self.data.select_dtypes(include=[np.number]).columns.tolist()
            else:
                numeric_columns = [col for col in columns if col in self.data.columns and 
                                 pd.api.types.is_numeric_dtype(self.data[col])]
            
            if not numeric_columns:
                return {'success': False, 'error': 'No numeric columns found'}
            
            # Prepare data
            data_subset = self.data[numeric_columns].dropna()
            X = self.scaler.fit_transform(data_subset)
            
            if algorithm == 'kmeans':
                return self._perform_kmeans_clustering(X, data_subset, numeric_columns, n_clusters)
            elif algorithm == 'dbscan':
                return self._perform_dbscan_clustering(X, data_subset, numeric_columns)
            else:
                return {'success': False, 'error': f'Unknown algorithm: {algorithm}'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _perform_kmeans_clustering(self, X: np.ndarray, data_subset: pd.DataFrame, 
                                  columns: List[str], n_clusters: int = None) -> Dict[str, Any]:
        """Perform K-means clustering"""
        if n_clusters is None:
            # Find optimal number of clusters using silhouette score
            silhouette_scores = []
            max_clusters = min(10, len(data_subset) // 2)
            
            for k in range(2, max_clusters + 1):
                kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
                labels = kmeans.fit_predict(X)
                score = silhouette_score(X, labels)
                silhouette_scores.append((k, score))
            
            # Choose the number of clusters with the highest silhouette score
            n_clusters = max(silhouette_scores, key=lambda x: x[1])[0]
        
        # Perform final clustering
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        labels = kmeans.fit_predict(X)
        
        # Calculate silhouette score
        silhouette_avg = silhouette_score(X, labels)
        
        # Add cluster labels to data
        data_with_clusters = data_subset.copy()
        data_with_clusters['cluster'] = labels
        
        # Cluster statistics
        cluster_stats = {}
        for i in range(n_clusters):
            cluster_data = data_with_clusters[data_with_clusters['cluster'] == i]
            cluster_stats[f'cluster_{i}'] = {
                'size': len(cluster_data),
                'percentage': len(cluster_data) / len(data_with_clusters) * 100,
                'centroid': kmeans.cluster_centers_[i].tolist()
            }
        
        return {
            'success': True,
            'algorithm': 'kmeans',
            'n_clusters': n_clusters,
            'silhouette_score': float(silhouette_avg),
            'cluster_labels': labels.tolist(),
            'cluster_centers': kmeans.cluster_centers_.tolist(),
            'cluster_stats': cluster_stats,
            'data_with_clusters': data_with_clusters.to_dict('records')
        }
    
    def _perform_dbscan_clustering(self, X: np.ndarray, data_subset: pd.DataFrame, 
                                  columns: List[str]) -> Dict[str, Any]:
        """Perform DBSCAN clustering"""
        # Find optimal eps using k-distance graph (simplified approach)
        from sklearn.neighbors import NearestNeighbors
        
        k = min(4, len(data_subset) - 1)
        neighbors = NearestNeighbors(n_neighbors=k)
        neighbors_fit = neighbors.fit(X)
        distances, indices = neighbors_fit.kneighbors(X)
        distances = np.sort(distances[:, k-1], axis=0)
        
        # Use a simple heuristic for eps
        eps = np.percentile(distances, 75)
        
        # Perform DBSCAN
        dbscan = DBSCAN(eps=eps, min_samples=max(2, k))
        labels = dbscan.fit_predict(X)
        
        # Calculate silhouette score (only if we have multiple clusters)
        unique_labels = set(labels)
        if len(unique_labels) > 1:
            silhouette_avg = silhouette_score(X, labels)
        else:
            silhouette_avg = -1
        
        # Add cluster labels to data
        data_with_clusters = data_subset.copy()
        data_with_clusters['cluster'] = labels
        
        # Cluster statistics
        cluster_stats = {}
        for label in unique_labels:
            if label == -1:  # Noise points
                cluster_stats['noise'] = {
                    'size': len(data_with_clusters[data_with_clusters['cluster'] == label]),
                    'percentage': len(data_with_clusters[data_with_clusters['cluster'] == label]) / len(data_with_clusters) * 100
                }
            else:
                cluster_data = data_with_clusters[data_with_clusters['cluster'] == label]
                cluster_stats[f'cluster_{label}'] = {
                    'size': len(cluster_data),
                    'percentage': len(cluster_data) / len(data_with_clusters) * 100
                }
        
        return {
            'success': True,
            'algorithm': 'dbscan',
            'eps': float(eps),
            'n_clusters': len(unique_labels) - (1 if -1 in unique_labels else 0),
            'silhouette_score': float(silhouette_avg),
            'cluster_labels': labels.tolist(),
            'cluster_stats': cluster_stats,
            'data_with_clusters': data_with_clusters.to_dict('records')
        }
    
    def feature_importance_analysis(self, target_column: str, 
                                   columns: List[str] = None) -> Dict[str, Any]:
        """
        Analyze feature importance for a target variable
        
        Args:
            target_column: Target variable column
            columns: List of feature columns to analyze
            
        Returns:
            Dictionary with feature importance results
        """
        if self.data is None or target_column not in self.data.columns:
            return {'success': False, 'error': 'Target column not found'}
        
        try:
            if columns is None:
                feature_columns = [col for col in self.data.columns 
                                 if col != target_column and 
                                 pd.api.types.is_numeric_dtype(self.data[col])]
            else:
                feature_columns = [col for col in columns if col in self.data.columns and 
                                 col != target_column and 
                                 pd.api.types.is_numeric_dtype(self.data[col])]
            
            if not feature_columns:
                return {'success': False, 'error': 'No feature columns found'}
            
            # Prepare data
            data_subset = self.data[feature_columns + [target_column]].dropna()
            X = data_subset[feature_columns]
            y = data_subset[target_column]
            
            # Determine if target is categorical or continuous
            is_categorical = not pd.api.types.is_numeric_dtype(y) or y.nunique() < 10
            
            # Feature selection
            if is_categorical:
                # Classification problem
                selector = SelectKBest(score_func=f_classif, k=min(10, len(feature_columns)))
                selector.fit(X, y)
                scores = selector.scores_
            else:
                # Regression problem
                selector = SelectKBest(score_func=f_regression, k=min(10, len(feature_columns)))
                selector.fit(X, y)
                scores = selector.scores_
            
            # Create feature importance results
            feature_importance = []
            for i, feature in enumerate(feature_columns):
                feature_importance.append({
                    'feature': feature,
                    'score': float(scores[i]) if not np.isnan(scores[i]) else 0,
                    'selected': i in selector.get_support(indices=True)
                })
            
            # Sort by score
            feature_importance.sort(key=lambda x: x['score'], reverse=True)
            
            return {
                'success': True,
                'target_column': target_column,
                'target_type': 'categorical' if is_categorical else 'continuous',
                'feature_importance': feature_importance,
                'selected_features': [f['feature'] for f in feature_importance if f['selected']]
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def pattern_recognition(self, columns: List[str] = None) -> Dict[str, Any]:
        """
        Identify patterns in the data
        
        Args:
            columns: List of columns to analyze
            
        Returns:
            Dictionary with pattern recognition results
        """
        if self.data is None:
            return {'success': False, 'error': 'No data provided'}
        
        try:
            if columns is None:
                numeric_columns = self.data.select_dtypes(include=[np.number]).columns.tolist()
                categorical_columns = self.data.select_dtypes(include=['object']).columns.tolist()
            else:
                numeric_columns = [col for col in columns if col in self.data.columns and 
                                 pd.api.types.is_numeric_dtype(self.data[col])]
                categorical_columns = [col for col in columns if col in self.data.columns and 
                                     pd.api.types.is_object_dtype(self.data[col])]
            
            patterns = {}
            
            # Numeric patterns
            if numeric_columns:
                patterns['numeric'] = self._analyze_numeric_patterns(numeric_columns)
            
            # Categorical patterns
            if categorical_columns:
                patterns['categorical'] = self._analyze_categorical_patterns(categorical_columns)
            
            # Cross-patterns
            if numeric_columns and categorical_columns:
                patterns['cross_patterns'] = self._analyze_cross_patterns(numeric_columns, categorical_columns)
            
            return {
                'success': True,
                'patterns': patterns,
                'columns_analyzed': {
                    'numeric': numeric_columns,
                    'categorical': categorical_columns
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _analyze_numeric_patterns(self, columns: List[str]) -> Dict[str, Any]:
        """Analyze patterns in numeric columns"""
        patterns = {}
        
        for col in columns:
            data = self.data[col].dropna()
            
            # Trend analysis
            if len(data) > 1:
                correlation_with_index = np.corrcoef(range(len(data)), data)[0, 1]
                patterns[col] = {
                    'trend': 'increasing' if correlation_with_index > 0.1 else 
                            'decreasing' if correlation_with_index < -0.1 else 'stable',
                    'trend_strength': abs(correlation_with_index),
                    'variance': float(data.var()),
                    'coefficient_of_variation': float(data.std() / data.mean()) if data.mean() != 0 else 0
                }
        
        return patterns
    
    def _analyze_categorical_patterns(self, columns: List[str]) -> Dict[str, Any]:
        """Analyze patterns in categorical columns"""
        patterns = {}
        
        for col in columns:
            data = self.data[col].dropna()
            value_counts = data.value_counts()
            
            patterns[col] = {
                'unique_values': len(value_counts),
                'most_common': value_counts.index[0],
                'most_common_frequency': int(value_counts.iloc[0]),
                'entropy': float(-sum((count/len(data)) * np.log2(count/len(data)) 
                                    for count in value_counts if count > 0)),
                'concentration': float(value_counts.iloc[0] / len(data))
            }
        
        return patterns
    
    def _analyze_cross_patterns(self, numeric_columns: List[str], 
                               categorical_columns: List[str]) -> Dict[str, Any]:
        """Analyze patterns between numeric and categorical columns"""
        cross_patterns = {}
        
        for cat_col in categorical_columns:
            for num_col in numeric_columns:
                key = f"{cat_col}_vs_{num_col}"
                
                # Group by categorical variable and analyze numeric variable
                grouped = self.data.groupby(cat_col)[num_col].agg(['mean', 'std', 'count'])
                
                cross_patterns[key] = {
                    'group_means': grouped['mean'].to_dict(),
                    'group_std': grouped['std'].to_dict(),
                    'group_counts': grouped['count'].to_dict(),
                    'variance_ratio': float(grouped['mean'].var() / grouped['mean'].mean()) if grouped['mean'].mean() != 0 else 0
                }
        
        return cross_patterns

# Global instance for easy access
ml_insights = MLInsights()