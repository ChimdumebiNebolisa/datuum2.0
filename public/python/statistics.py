"""
Statistics module for Datuum 2.0
Handles descriptive statistics, correlation analysis, regression, and hypothesis testing
"""

import pandas as pd
import numpy as np
from scipy import stats
from scipy.stats import pearsonr, spearmanr, chi2_contingency, ttest_ind, f_oneway
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_squared_error
from typing import Dict, List, Any, Optional, Tuple, Union
import warnings
warnings.filterwarnings('ignore')

class StatisticsAnalyzer:
    def __init__(self, data: pd.DataFrame = None):
        self.data = data
        self.results = {}
    
    def set_data(self, data: pd.DataFrame):
        """Set the dataset for analysis"""
        self.data = data
    
    def descriptive_statistics(self, columns: List[str] = None) -> Dict[str, Any]:
        """
        Calculate descriptive statistics for numeric columns
        
        Args:
            columns: List of columns to analyze. If None, analyzes all numeric columns
            
        Returns:
            Dictionary with descriptive statistics
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
            
            stats_dict = {}
            
            for col in numeric_columns:
                series = self.data[col].dropna()
                
                if len(series) == 0:
                    continue
                
                stats_dict[col] = {
                    'count': len(series),
                    'mean': float(series.mean()),
                    'median': float(series.median()),
                    'mode': float(series.mode().iloc[0]) if not series.mode().empty else None,
                    'std': float(series.std()),
                    'variance': float(series.var()),
                    'min': float(series.min()),
                    'max': float(series.max()),
                    'range': float(series.max() - series.min()),
                    'q25': float(series.quantile(0.25)),
                    'q50': float(series.quantile(0.50)),
                    'q75': float(series.quantile(0.75)),
                    'iqr': float(series.quantile(0.75) - series.quantile(0.25)),
                    'skewness': float(series.skew()),
                    'kurtosis': float(series.kurtosis()),
                    'coefficient_of_variation': float(series.std() / series.mean()) if series.mean() != 0 else None
                }
            
            return {
                'success': True,
                'statistics': stats_dict,
                'columns_analyzed': numeric_columns
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def correlation_analysis(self, columns: List[str] = None, 
                           method: str = 'pearson') -> Dict[str, Any]:
        """
        Calculate correlation matrix
        
        Args:
            columns: List of columns to analyze
            method: Correlation method ('pearson', 'spearman', 'kendall')
            
        Returns:
            Dictionary with correlation results
        """
        if self.data is None:
            return {'success': False, 'error': 'No data provided'}
        
        try:
            if columns is None:
                numeric_columns = self.data.select_dtypes(include=[np.number]).columns.tolist()
            else:
                numeric_columns = [col for col in columns if col in self.data.columns and 
                                 pd.api.types.is_numeric_dtype(self.data[col])]
            
            if len(numeric_columns) < 2:
                return {'success': False, 'error': 'Need at least 2 numeric columns for correlation'}
            
            # Calculate correlation matrix
            corr_matrix = self.data[numeric_columns].corr(method=method)
            
            # Get correlation pairs with significance
            correlations = []
            for i in range(len(corr_matrix.columns)):
                for j in range(i+1, len(corr_matrix.columns)):
                    col1 = corr_matrix.columns[i]
                    col2 = corr_matrix.columns[j]
                    corr_value = corr_matrix.iloc[i, j]
                    
                    # Calculate p-value for significance
                    try:
                        if method == 'pearson':
                            _, p_value = pearsonr(self.data[col1].dropna(), self.data[col2].dropna())
                        elif method == 'spearman':
                            _, p_value = spearmanr(self.data[col1].dropna(), self.data[col2].dropna())
                        else:
                            p_value = np.nan
                    except:
                        p_value = np.nan
                    
                    correlations.append({
                        'column1': col1,
                        'column2': col2,
                        'correlation': float(corr_value),
                        'p_value': float(p_value) if not np.isnan(p_value) else None,
                        'significant': p_value < 0.05 if not np.isnan(p_value) else None,
                        'strength': self._interpret_correlation_strength(abs(corr_value))
                    })
            
            return {
                'success': True,
                'method': method,
                'correlation_matrix': corr_matrix.to_dict(),
                'correlations': correlations,
                'columns_analyzed': numeric_columns
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def regression_analysis(self, x_columns: List[str], y_column: str, 
                          model_type: str = 'linear') -> Dict[str, Any]:
        """
        Perform regression analysis
        
        Args:
            x_columns: List of independent variable columns
            y_column: Dependent variable column
            model_type: Type of regression ('linear', 'polynomial')
            
        Returns:
            Dictionary with regression results
        """
        if self.data is None:
            return {'success': False, 'error': 'No data provided'}
        
        try:
            # Check if columns exist
            missing_cols = [col for col in x_columns + [y_column] if col not in self.data.columns]
            if missing_cols:
                return {'success': False, 'error': f'Columns not found: {missing_cols}'}
            
            # Prepare data
            X = self.data[x_columns].select_dtypes(include=[np.number]).dropna()
            y = self.data[y_column].dropna()
            
            # Align data
            common_index = X.index.intersection(y.index)
            X = X.loc[common_index]
            y = y.loc[common_index]
            
            if len(X) == 0 or len(y) == 0:
                return {'success': False, 'error': 'No valid data points for regression'}
            
            # Standardize features
            scaler = StandardScaler()
            X_scaled = scaler.fit_transform(X)
            
            # Fit model
            model = LinearRegression()
            model.fit(X_scaled, y)
            
            # Make predictions
            y_pred = model.predict(X_scaled)
            
            # Calculate metrics
            r2 = r2_score(y, y_pred)
            mse = mean_squared_error(y, y_pred)
            rmse = np.sqrt(mse)
            
            # Feature importance (coefficients)
            feature_importance = dict(zip(x_columns, model.coef_))
            
            # Residuals analysis
            residuals = y - y_pred
            
            return {
                'success': True,
                'model_type': model_type,
                'r_squared': float(r2),
                'adjusted_r_squared': float(1 - (1 - r2) * (len(y) - 1) / (len(y) - len(x_columns) - 1)),
                'mse': float(mse),
                'rmse': float(rmse),
                'coefficients': {col: float(coef) for col, coef in feature_importance.items()},
                'intercept': float(model.intercept_),
                'feature_importance': dict(sorted(feature_importance.items(), key=lambda x: abs(x[1]), reverse=True)),
                'residuals_stats': {
                    'mean': float(residuals.mean()),
                    'std': float(residuals.std()),
                    'min': float(residuals.min()),
                    'max': float(residuals.max())
                },
                'sample_size': len(X)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def hypothesis_testing(self, test_type: str, **kwargs) -> Dict[str, Any]:
        """
        Perform various hypothesis tests
        
        Args:
            test_type: Type of test ('ttest', 'chi_square', 'anova', 'normality')
            **kwargs: Test-specific parameters
            
        Returns:
            Dictionary with test results
        """
        if self.data is None:
            return {'success': False, 'error': 'No data provided'}
        
        try:
            if test_type == 'ttest':
                return self._perform_ttest(**kwargs)
            elif test_type == 'chi_square':
                return self._perform_chi_square(**kwargs)
            elif test_type == 'anova':
                return self._perform_anova(**kwargs)
            elif test_type == 'normality':
                return self._perform_normality_test(**kwargs)
            else:
                return {'success': False, 'error': f'Unknown test type: {test_type}'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _perform_ttest(self, column1: str, column2: str = None, 
                      group_column: str = None, group_value1: str = None, 
                      group_value2: str = None) -> Dict[str, Any]:
        """Perform t-test"""
        if column2:
            # Independent samples t-test
            data1 = self.data[column1].dropna()
            data2 = self.data[column2].dropna()
            statistic, p_value = ttest_ind(data1, data2)
            test_type = 'independent_samples'
        elif group_column and group_value1 and group_value2:
            # T-test for grouped data
            group1 = self.data[self.data[group_column] == group_value1][column1].dropna()
            group2 = self.data[self.data[group_column] == group_value2][column1].dropna()
            statistic, p_value = ttest_ind(group1, group2)
            test_type = 'grouped_comparison'
        else:
            return {'success': False, 'error': 'Invalid parameters for t-test'}
        
        return {
            'success': True,
            'test_type': test_type,
            'statistic': float(statistic),
            'p_value': float(p_value),
            'significant': p_value < 0.05,
            'interpretation': self._interpret_p_value(p_value)
        }
    
    def _perform_chi_square(self, column1: str, column2: str) -> Dict[str, Any]:
        """Perform chi-square test of independence"""
        contingency_table = pd.crosstab(self.data[column1], self.data[column2])
        chi2, p_value, dof, expected = chi2_contingency(contingency_table)
        
        return {
            'success': True,
            'test_type': 'chi_square_independence',
            'chi2_statistic': float(chi2),
            'p_value': float(p_value),
            'degrees_of_freedom': int(dof),
            'significant': p_value < 0.05,
            'contingency_table': contingency_table.to_dict(),
            'interpretation': self._interpret_p_value(p_value)
        }
    
    def _perform_anova(self, numeric_column: str, categorical_column: str) -> Dict[str, Any]:
        """Perform one-way ANOVA"""
        groups = [group[numeric_column].dropna() for name, group in 
                 self.data.groupby(categorical_column)]
        
        if len(groups) < 2:
            return {'success': False, 'error': 'Need at least 2 groups for ANOVA'}
        
        statistic, p_value = f_oneway(*groups)
        
        return {
            'success': True,
            'test_type': 'one_way_anova',
            'f_statistic': float(statistic),
            'p_value': float(p_value),
            'significant': p_value < 0.05,
            'groups': list(self.data[categorical_column].unique()),
            'interpretation': self._interpret_p_value(p_value)
        }
    
    def _perform_normality_test(self, column: str) -> Dict[str, Any]:
        """Perform normality test (Shapiro-Wilk)"""
        data = self.data[column].dropna()
        
        if len(data) > 5000:  # Shapiro-Wilk is limited to 5000 samples
            statistic, p_value = stats.normaltest(data)
            test_name = 'D\'Agostino and Pearson'
        else:
            statistic, p_value = stats.shapiro(data)
            test_name = 'Shapiro-Wilk'
        
        return {
            'success': True,
            'test_type': 'normality',
            'test_name': test_name,
            'statistic': float(statistic),
            'p_value': float(p_value),
            'is_normal': p_value > 0.05,
            'interpretation': 'Data appears normal' if p_value > 0.05 else 'Data does not appear normal'
        }
    
    def _interpret_correlation_strength(self, abs_corr: float) -> str:
        """Interpret correlation strength"""
        if abs_corr >= 0.9:
            return 'Very strong'
        elif abs_corr >= 0.7:
            return 'Strong'
        elif abs_corr >= 0.5:
            return 'Moderate'
        elif abs_corr >= 0.3:
            return 'Weak'
        else:
            return 'Very weak'
    
    def _interpret_p_value(self, p_value: float) -> str:
        """Interpret p-value significance"""
        if p_value < 0.001:
            return 'Highly significant (p < 0.001)'
        elif p_value < 0.01:
            return 'Very significant (p < 0.01)'
        elif p_value < 0.05:
            return 'Significant (p < 0.05)'
        elif p_value < 0.1:
            return 'Marginally significant (p < 0.1)'
        else:
            return 'Not significant (p >= 0.1)'
    
    def distribution_analysis(self, column: str) -> Dict[str, Any]:
        """
        Analyze the distribution of a column
        
        Args:
            column: Column to analyze
            
        Returns:
            Dictionary with distribution analysis
        """
        if self.data is None or column not in self.data.columns:
            return {'success': False, 'error': 'Column not found'}
        
        try:
            data = self.data[column].dropna()
            
            if not pd.api.types.is_numeric_dtype(data):
                # Categorical distribution
                value_counts = data.value_counts()
                return {
                    'success': True,
                    'type': 'categorical',
                    'unique_values': len(value_counts),
                    'most_frequent': value_counts.index[0],
                    'frequency': int(value_counts.iloc[0]),
                    'distribution': value_counts.head(10).to_dict()
                }
            
            # Numeric distribution
            hist, bin_edges = np.histogram(data, bins='auto')
            
            return {
                'success': True,
                'type': 'numeric',
                'bin_edges': bin_edges.tolist(),
                'frequencies': hist.tolist(),
                'skewness': float(data.skew()),
                'kurtosis': float(data.kurtosis()),
                'is_normal': self._perform_normality_test(column)['is_normal']
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

# Global instance for easy access
statistics_analyzer = StatisticsAnalyzer()