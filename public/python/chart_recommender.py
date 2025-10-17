"""
Chart Recommender module for Datuum 2.0
Uses machine learning and data analysis to recommend optimal chart types
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

class ChartRecommender:
    def __init__(self, data: pd.DataFrame = None):
        self.data = data
        self.chart_rules = self._initialize_chart_rules()
    
    def set_data(self, data: pd.DataFrame):
        """Set the dataset for analysis"""
        self.data = data
    
    def _initialize_chart_rules(self) -> Dict[str, Dict]:
        """Initialize chart recommendation rules"""
        return {
            'bar': {
                'description': 'Bar Chart - Best for comparing values across categories',
                'suitable_for': ['categorical_comparison', 'ranking', 'part_to_whole'],
                'data_requirements': {
                    'min_columns': 1,
                    'max_columns': 2,
                    'categorical_required': True,
                    'numeric_preferred': True
                },
                'score_factors': {
                    'categorical_columns': 0.8,
                    'numeric_columns': 0.6,
                    'unique_values_range': (2, 20),
                    'data_size_range': (1, 1000)
                }
            },
            'line': {
                'description': 'Line Chart - Best for showing trends over time',
                'suitable_for': ['trends', 'time_series', 'continuous_data'],
                'data_requirements': {
                    'min_columns': 1,
                    'max_columns': 10,
                    'time_series_preferred': True,
                    'numeric_required': True
                },
                'score_factors': {
                    'time_columns': 0.9,
                    'numeric_columns': 0.8,
                    'continuous_data': 0.7,
                    'data_size_range': (10, 10000)
                }
            },
            'scatter': {
                'description': 'Scatter Plot - Best for showing relationships between two variables',
                'suitable_for': ['correlation', 'distribution', 'outliers'],
                'data_requirements': {
                    'min_columns': 2,
                    'max_columns': 3,
                    'numeric_required': True,
                    'continuous_preferred': True
                },
                'score_factors': {
                    'numeric_columns': 0.9,
                    'continuous_data': 0.8,
                    'correlation_potential': 0.7,
                    'data_size_range': (20, 10000)
                }
            },
            'pie': {
                'description': 'Pie Chart - Best for showing proportions of a whole',
                'suitable_for': ['part_to_whole', 'proportions', 'percentages'],
                'data_requirements': {
                    'min_columns': 1,
                    'max_columns': 1,
                    'categorical_required': True,
                    'limited_categories': True
                },
                'score_factors': {
                    'categorical_columns': 0.8,
                    'unique_values_range': (2, 8),
                    'balanced_distribution': 0.6,
                    'data_size_range': (2, 50)
                }
            },
            'histogram': {
                'description': 'Histogram - Best for showing distribution of a single variable',
                'suitable_for': ['distribution', 'frequency', 'bins'],
                'data_requirements': {
                    'min_columns': 1,
                    'max_columns': 1,
                    'numeric_required': True,
                    'continuous_preferred': True
                },
                'score_factors': {
                    'numeric_columns': 0.9,
                    'continuous_data': 0.8,
                    'distribution_analysis': 0.7,
                    'data_size_range': (20, 10000)
                }
            },
            'box': {
                'description': 'Box Plot - Best for showing distribution and outliers',
                'suitable_for': ['distribution', 'outliers', 'quartiles', 'comparison'],
                'data_requirements': {
                    'min_columns': 1,
                    'max_columns': 2,
                    'numeric_required': True,
                    'categorical_optional': True
                },
                'score_factors': {
                    'numeric_columns': 0.9,
                    'outlier_potential': 0.8,
                    'distribution_analysis': 0.7,
                    'data_size_range': (10, 10000)
                }
            },
            'heatmap': {
                'description': 'Heatmap - Best for showing correlation matrix or 2D data',
                'suitable_for': ['correlation', 'patterns', 'matrix_data'],
                'data_requirements': {
                    'min_columns': 2,
                    'max_columns': 20,
                    'numeric_required': True,
                    'matrix_data_preferred': True
                },
                'score_factors': {
                    'numeric_columns': 0.8,
                    'correlation_matrix': 0.9,
                    'matrix_structure': 0.7,
                    'data_size_range': (5, 100)
                }
            },
            'area': {
                'description': 'Area Chart - Best for showing cumulative data over time',
                'suitable_for': ['cumulative_trends', 'stacked_data', 'time_series'],
                'data_requirements': {
                    'min_columns': 1,
                    'max_columns': 10,
                    'time_series_preferred': True,
                    'numeric_required': True
                },
                'score_factors': {
                    'time_columns': 0.8,
                    'numeric_columns': 0.7,
                    'cumulative_data': 0.8,
                    'data_size_range': (10, 10000)
                }
            }
        }
    
    def recommend_charts(self, columns: List[str] = None, 
                        analysis_type: str = 'general') -> Dict[str, Any]:
        """
        Recommend chart types based on data characteristics
        
        Args:
            columns: List of columns to analyze
            analysis_type: Type of analysis ('general', 'correlation', 'distribution', 'trends')
            
        Returns:
            Dictionary with chart recommendations
        """
        if self.data is None:
            return {'success': False, 'error': 'No data provided'}
        
        try:
            if columns is None:
                columns = self.data.columns.tolist()
            
            # Analyze data characteristics
            data_analysis = self._analyze_data_characteristics(columns)
            
            # Calculate scores for each chart type
            chart_scores = {}
            for chart_type, rules in self.chart_rules.items():
                score = self._calculate_chart_score(chart_type, data_analysis, rules)
                chart_scores[chart_type] = score
            
            # Sort charts by score
            sorted_charts = sorted(chart_scores.items(), key=lambda x: x[1], reverse=True)
            
            # Get top recommendations
            recommendations = []
            for chart_type, score in sorted_charts[:5]:
                if score > 0.3:  # Minimum threshold
                    recommendations.append({
                        'chart_type': chart_type,
                        'score': score,
                        'description': self.chart_rules[chart_type]['description'],
                        'suitable_for': self.chart_rules[chart_type]['suitable_for'],
                        'confidence': self._calculate_confidence(score, data_analysis)
                    })
            
            return {
                'success': True,
                'analysis_type': analysis_type,
                'data_analysis': data_analysis,
                'recommendations': recommendations,
                'all_scores': chart_scores
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _analyze_data_characteristics(self, columns: List[str]) -> Dict[str, Any]:
        """Analyze characteristics of the selected columns"""
        analysis = {
            'total_columns': len(columns),
            'numeric_columns': [],
            'categorical_columns': [],
            'time_columns': [],
            'data_types': {},
            'unique_values': {},
            'null_counts': {},
            'correlations': {},
            'distributions': {}
        }
        
        for col in columns:
            if col not in self.data.columns:
                continue
                
            series = self.data[col].dropna()
            
            # Data type analysis
            is_numeric = pd.api.types.is_numeric_dtype(series)
            is_categorical = pd.api.types.is_categorical_dtype(series) or series.dtype == 'object'
            is_datetime = pd.api.types.is_datetime64_any_dtype(series)
            
            analysis['data_types'][col] = {
                'is_numeric': is_numeric,
                'is_categorical': is_categorical,
                'is_datetime': is_datetime,
                'dtype': str(series.dtype)
            }
            
            # Categorize columns
            if is_numeric:
                analysis['numeric_columns'].append(col)
            elif is_categorical:
                analysis['categorical_columns'].append(col)
            
            if is_datetime:
                analysis['time_columns'].append(col)
            
            # Unique values analysis
            unique_count = series.nunique()
            analysis['unique_values'][col] = unique_count
            
            # Null values
            analysis['null_counts'][col] = self.data[col].isnull().sum()
            
            # Distribution analysis for numeric columns
            if is_numeric and len(series) > 0:
                analysis['distributions'][col] = {
                    'mean': float(series.mean()),
                    'std': float(series.std()),
                    'min': float(series.min()),
                    'max': float(series.max()),
                    'skewness': float(series.skew()),
                    'kurtosis': float(series.kurtosis()),
                    'coefficient_of_variation': float(series.std() / series.mean()) if series.mean() != 0 else 0
                }
        
        # Correlation analysis for numeric columns
        if len(analysis['numeric_columns']) > 1:
            numeric_data = self.data[analysis['numeric_columns']].select_dtypes(include=[np.number])
            if not numeric_data.empty:
                correlation_matrix = numeric_data.corr()
                analysis['correlations'] = correlation_matrix.to_dict()
        
        # Overall characteristics
        analysis['total_rows'] = len(self.data)
        analysis['numeric_count'] = len(analysis['numeric_columns'])
        analysis['categorical_count'] = len(analysis['categorical_columns'])
        analysis['time_count'] = len(analysis['time_columns'])
        
        return analysis
    
    def _calculate_chart_score(self, chart_type: str, data_analysis: Dict[str, Any], 
                              rules: Dict[str, Any]) -> float:
        """Calculate suitability score for a chart type"""
        score = 0.0
        factors = rules.get('score_factors', {})
        
        # Column count factor
        total_columns = data_analysis['total_columns']
        min_cols = rules['data_requirements']['min_columns']
        max_cols = rules['data_requirements']['max_columns']
        
        if min_cols <= total_columns <= max_cols:
            score += 0.2
        else:
            score -= 0.1
        
        # Data type factors
        if rules['data_requirements'].get('numeric_required', False):
            if data_analysis['numeric_count'] > 0:
                score += factors.get('numeric_columns', 0.5)
            else:
                score -= 0.5
        
        if rules['data_requirements'].get('categorical_required', False):
            if data_analysis['categorical_count'] > 0:
                score += factors.get('categorical_columns', 0.5)
            else:
                score -= 0.3
        
        # Time series factor
        if rules['data_requirements'].get('time_series_preferred', False):
            if data_analysis['time_count'] > 0:
                score += factors.get('time_columns', 0.3)
        
        # Unique values factor
        if 'unique_values_range' in factors:
            min_unique, max_unique = factors['unique_values_range']
            for col, unique_count in data_analysis['unique_values'].items():
                if min_unique <= unique_count <= max_unique:
                    score += 0.1
                else:
                    score -= 0.05
        
        # Data size factor
        if 'data_size_range' in factors:
            min_size, max_size = factors['data_size_range']
            data_size = data_analysis['total_rows']
            if min_size <= data_size <= max_size:
                score += 0.1
            else:
                score -= 0.05
        
        # Special factors for specific chart types
        if chart_type == 'pie':
            # Pie charts work best with balanced distributions
            for col in data_analysis['categorical_columns']:
                unique_count = data_analysis['unique_values'][col]
                if 2 <= unique_count <= 8:
                    score += 0.2
        
        elif chart_type == 'scatter':
            # Scatter plots work best with continuous numeric data
            for col in data_analysis['numeric_columns']:
                if col in data_analysis['distributions']:
                    cv = data_analysis['distributions'][col]['coefficient_of_variation']
                    if cv > 0.1:  # Good variation
                        score += 0.1
        
        elif chart_type == 'heatmap':
            # Heatmaps work best with correlation data
            if data_analysis['correlations']:
                score += factors.get('correlation_matrix', 0.3)
        
        elif chart_type == 'box':
            # Box plots work best when there are potential outliers
            for col in data_analysis['numeric_columns']:
                if col in data_analysis['distributions']:
                    kurtosis = data_analysis['distributions'][col]['kurtosis']
                    if kurtosis > 3:  # Heavy-tailed distribution
                        score += 0.2
        
        # Normalize score to 0-1 range
        return max(0, min(1, score))
    
    def _calculate_confidence(self, score: float, data_analysis: Dict[str, Any]) -> str:
        """Calculate confidence level for the recommendation"""
        if score >= 0.8:
            return 'High'
        elif score >= 0.6:
            return 'Medium'
        elif score >= 0.4:
            return 'Low'
        else:
            return 'Very Low'
    
    def get_chart_configuration(self, chart_type: str, columns: List[str]) -> Dict[str, Any]:
        """
        Get recommended configuration for a specific chart type
        
        Args:
            chart_type: Type of chart
            columns: Columns to use in the chart
            
        Returns:
            Dictionary with chart configuration
        """
        if chart_type not in self.chart_rules:
            return {'success': False, 'error': f'Unknown chart type: {chart_type}'}
        
        try:
            config = {
                'chart_type': chart_type,
                'title': f'{chart_type.title()} Chart',
                'description': self.chart_rules[chart_type]['description']
            }
            
            # Analyze data for configuration
            data_analysis = self._analyze_data_characteristics(columns)
            
            if chart_type == 'bar':
                config.update(self._get_bar_config(data_analysis, columns))
            elif chart_type == 'line':
                config.update(self._get_line_config(data_analysis, columns))
            elif chart_type == 'scatter':
                config.update(self._get_scatter_config(data_analysis, columns))
            elif chart_type == 'pie':
                config.update(self._get_pie_config(data_analysis, columns))
            elif chart_type == 'histogram':
                config.update(self._get_histogram_config(data_analysis, columns))
            elif chart_type == 'box':
                config.update(self._get_box_config(data_analysis, columns))
            elif chart_type == 'heatmap':
                config.update(self._get_heatmap_config(data_analysis, columns))
            elif chart_type == 'area':
                config.update(self._get_area_config(data_analysis, columns))
            
            return {
                'success': True,
                'configuration': config
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _get_bar_config(self, data_analysis: Dict[str, Any], columns: List[str]) -> Dict[str, Any]:
        """Get configuration for bar chart"""
        config = {
            'x_axis': None,
            'y_axis': None,
            'orientation': 'vertical'
        }
        
        # Find categorical column for x-axis
        for col in columns:
            if col in data_analysis['categorical_columns']:
                config['x_axis'] = col
                break
        
        # Find numeric column for y-axis
        for col in columns:
            if col in data_analysis['numeric_columns']:
                config['y_axis'] = col
                break
        
        return config
    
    def _get_line_config(self, data_analysis: Dict[str, Any], columns: List[str]) -> Dict[str, Any]:
        """Get configuration for line chart"""
        config = {
            'x_axis': None,
            'y_axes': [],
            'is_time_series': False
        }
        
        # Find time column for x-axis
        for col in columns:
            if col in data_analysis['time_columns']:
                config['x_axis'] = col
                config['is_time_series'] = True
                break
        
        # If no time column, use first numeric column
        if not config['x_axis']:
            for col in columns:
                if col in data_analysis['numeric_columns']:
                    config['x_axis'] = col
                    break
        
        # Add numeric columns as y-axes
        for col in columns:
            if col in data_analysis['numeric_columns'] and col != config['x_axis']:
                config['y_axes'].append(col)
        
        return config
    
    def _get_scatter_config(self, data_analysis: Dict[str, Any], columns: List[str]) -> Dict[str, Any]:
        """Get configuration for scatter plot"""
        numeric_cols = [col for col in columns if col in data_analysis['numeric_columns']]
        
        config = {
            'x_axis': numeric_cols[0] if len(numeric_cols) > 0 else None,
            'y_axis': numeric_cols[1] if len(numeric_cols) > 1 else None,
            'color_axis': numeric_cols[2] if len(numeric_cols) > 2 else None
        }
        
        return config
    
    def _get_pie_config(self, data_analysis: Dict[str, Any], columns: List[str]) -> Dict[str, Any]:
        """Get configuration for pie chart"""
        config = {
            'label_column': None,
            'value_column': None
        }
        
        # Find categorical column for labels
        for col in columns:
            if col in data_analysis['categorical_columns']:
                config['label_column'] = col
                break
        
        # Find numeric column for values
        for col in columns:
            if col in data_analysis['numeric_columns']:
                config['value_column'] = col
                break
        
        return config
    
    def _get_histogram_config(self, data_analysis: Dict[str, Any], columns: List[str]) -> Dict[str, Any]:
        """Get configuration for histogram"""
        numeric_cols = [col for col in columns if col in data_analysis['numeric_columns']]
        
        config = {
            'column': numeric_cols[0] if len(numeric_cols) > 0 else None,
            'bins': 'auto'
        }
        
        return config
    
    def _get_box_config(self, data_analysis: Dict[str, Any], columns: List[str]) -> Dict[str, Any]:
        """Get configuration for box plot"""
        config = {
            'value_column': None,
            'group_column': None
        }
        
        # Find numeric column for values
        for col in columns:
            if col in data_analysis['numeric_columns']:
                config['value_column'] = col
                break
        
        # Find categorical column for grouping
        for col in columns:
            if col in data_analysis['categorical_columns']:
                config['group_column'] = col
                break
        
        return config
    
    def _get_heatmap_config(self, data_analysis: Dict[str, Any], columns: List[str]) -> Dict[str, Any]:
        """Get configuration for heatmap"""
        config = {
            'columns': [col for col in columns if col in data_analysis['numeric_columns']],
            'correlation_matrix': len(config['columns']) > 1
        }
        
        return config
    
    def _get_area_config(self, data_analysis: Dict[str, Any], columns: List[str]) -> Dict[str, Any]:
        """Get configuration for area chart"""
        config = {
            'x_axis': None,
            'y_axes': [],
            'stacked': True
        }
        
        # Find time column for x-axis
        for col in columns:
            if col in data_analysis['time_columns']:
                config['x_axis'] = col
                break
        
        # Add numeric columns as y-axes
        for col in columns:
            if col in data_analysis['numeric_columns'] and col != config['x_axis']:
                config['y_axes'].append(col)
        
        return config

# Global instance for easy access
chart_recommender = ChartRecommender()