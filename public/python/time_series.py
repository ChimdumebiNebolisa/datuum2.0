"""
Time Series Analysis module for Datuum 2.0
Handles time series analysis, forecasting, decomposition, and trend analysis
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import warnings
warnings.filterwarnings('ignore')

class TimeSeriesAnalyzer:
    def __init__(self, data: pd.DataFrame = None):
        self.data = data
        self.time_column = None
        self.value_columns = []
    
    def set_data(self, data: pd.DataFrame, time_column: str = None, value_columns: List[str] = None):
        """Set the dataset and identify time and value columns"""
        self.data = data
        
        if time_column:
            self.time_column = time_column
        else:
            # Auto-detect time column
            self.time_column = self._detect_time_column()
        
        if value_columns:
            self.value_columns = value_columns
        else:
            # Auto-detect numeric value columns
            self.value_columns = self._detect_value_columns()
    
    def _detect_time_column(self) -> Optional[str]:
        """Auto-detect time column"""
        for col in self.data.columns:
            if pd.api.types.is_datetime64_any_dtype(self.data[col]):
                return col
            # Try to convert to datetime
            try:
                pd.to_datetime(self.data[col])
                return col
            except:
                continue
        return None
    
    def _detect_value_columns(self) -> List[str]:
        """Auto-detect numeric value columns"""
        numeric_columns = self.data.select_dtypes(include=[np.number]).columns.tolist()
        if self.time_column in numeric_columns:
            numeric_columns.remove(self.time_column)
        return numeric_columns
    
    def basic_analysis(self) -> Dict[str, Any]:
        """
        Perform basic time series analysis
        
        Returns:
            Dictionary with basic time series statistics
        """
        if self.data is None or not self.time_column:
            return {'success': False, 'error': 'No time column detected'}
        
        try:
            # Convert time column to datetime
            time_series = pd.to_datetime(self.data[self.time_column])
            
            analysis = {
                'success': True,
                'time_column': self.time_column,
                'value_columns': self.value_columns,
                'time_range': {
                    'start': str(time_series.min()),
                    'end': str(time_series.max()),
                    'duration': str(time_series.max() - time_series.min())
                },
                'frequency_analysis': {},
                'missing_values': {},
                'basic_stats': {}
            }
            
            # Frequency analysis
            time_diffs = time_series.diff().dropna()
            if not time_diffs.empty:
                most_common_freq = time_diffs.mode().iloc[0] if not time_diffs.mode().empty else None
                analysis['frequency_analysis'] = {
                    'most_common_interval': str(most_common_freq) if most_common_freq else None,
                    'intervals': time_diffs.value_counts().head().to_dict()
                }
            
            # Missing values analysis
            analysis['missing_values']['time'] = time_series.isnull().sum()
            for col in self.value_columns:
                analysis['missing_values'][col] = self.data[col].isnull().sum()
            
            # Basic statistics for each value column
            for col in self.value_columns:
                if col in self.data.columns:
                    series = self.data[col].dropna()
                    if len(series) > 0:
                        analysis['basic_stats'][col] = {
                            'count': len(series),
                            'mean': float(series.mean()),
                            'std': float(series.std()),
                            'min': float(series.min()),
                            'max': float(series.max()),
                            'first_value': float(series.iloc[0]),
                            'last_value': float(series.iloc[-1]),
                            'total_change': float(series.iloc[-1] - series.iloc[0]) if len(series) > 1 else 0,
                            'percent_change': float((series.iloc[-1] - series.iloc[0]) / series.iloc[0] * 100) if len(series) > 1 and series.iloc[0] != 0 else 0
                        }
            
            return analysis
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def trend_analysis(self, column: str = None) -> Dict[str, Any]:
        """
        Analyze trends in time series data
        
        Args:
            column: Column to analyze. If None, analyzes all value columns
            
        Returns:
            Dictionary with trend analysis results
        """
        if self.data is None or not self.time_column:
            return {'success': False, 'error': 'No time column detected'}
        
        try:
            if column is None:
                columns_to_analyze = self.value_columns
            else:
                columns_to_analyze = [column] if column in self.value_columns else []
            
            if not columns_to_analyze:
                return {'success': False, 'error': 'No valid columns to analyze'}
            
            trend_results = {}
            
            for col in columns_to_analyze:
                if col not in self.data.columns:
                    continue
                
                # Prepare data
                ts_data = self.data[[self.time_column, col]].dropna()
                if len(ts_data) < 2:
                    continue
                
                # Sort by time
                ts_data = ts_data.sort_values(self.time_column)
                
                # Calculate trend using linear regression
                x = np.arange(len(ts_data))
                y = ts_data[col].values
                
                # Simple linear regression
                n = len(x)
                sum_x = np.sum(x)
                sum_y = np.sum(y)
                sum_xy = np.sum(x * y)
                sum_x2 = np.sum(x * x)
                
                slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
                intercept = (sum_y - slope * sum_x) / n
                
                # Calculate R-squared
                y_pred = slope * x + intercept
                ss_res = np.sum((y - y_pred) ** 2)
                ss_tot = np.sum((y - np.mean(y)) ** 2)
                r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
                
                # Determine trend direction
                if slope > 0:
                    trend_direction = 'increasing'
                elif slope < 0:
                    trend_direction = 'decreasing'
                else:
                    trend_direction = 'stable'
                
                # Calculate trend strength
                if abs(slope) > np.std(y) * 0.1:
                    trend_strength = 'strong'
                elif abs(slope) > np.std(y) * 0.05:
                    trend_strength = 'moderate'
                else:
                    trend_strength = 'weak'
                
                trend_results[col] = {
                    'slope': float(slope),
                    'intercept': float(intercept),
                    'r_squared': float(r_squared),
                    'trend_direction': trend_direction,
                    'trend_strength': trend_strength,
                    'data_points': len(ts_data),
                    'start_value': float(y[0]),
                    'end_value': float(y[-1])
                }
            
            return {
                'success': True,
                'trend_analysis': trend_results,
                'columns_analyzed': columns_to_analyze
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def seasonal_analysis(self, column: str, period: int = None) -> Dict[str, Any]:
        """
        Analyze seasonal patterns in time series data
        
        Args:
            column: Column to analyze
            period: Seasonal period. If None, auto-detects
            
        Returns:
            Dictionary with seasonal analysis results
        """
        if self.data is None or not self.time_column or column not in self.data.columns:
            return {'success': False, 'error': 'Invalid column or no time column'}
        
        try:
            # Prepare data
            ts_data = self.data[[self.time_column, column]].dropna()
            if len(ts_data) < 10:
                return {'success': False, 'error': 'Insufficient data for seasonal analysis'}
            
            # Sort by time
            ts_data = ts_data.sort_values(self.time_column)
            time_series = pd.to_datetime(ts_data[self.time_column])
            values = ts_data[column].values
            
            # Auto-detect period if not provided
            if period is None:
                period = self._detect_seasonal_period(time_series, values)
            
            if period is None or period < 2:
                return {'success': False, 'error': 'Could not detect seasonal period'}
            
            # Calculate seasonal components
            seasonal_components = {}
            for i in range(period):
                seasonal_indices = np.arange(i, len(values), period)
                if len(seasonal_indices) > 0:
                    seasonal_values = values[seasonal_indices]
                    seasonal_components[f'season_{i}'] = {
                        'mean': float(np.mean(seasonal_values)),
                        'std': float(np.std(seasonal_values)),
                        'count': len(seasonal_values)
                    }
            
            # Calculate seasonal strength
            seasonal_strength = self._calculate_seasonal_strength(values, period)
            
            # Extract seasonal patterns
            seasonal_pattern = []
            for i in range(period):
                seasonal_indices = np.arange(i, len(values), period)
                if len(seasonal_indices) > 0:
                    seasonal_pattern.append(float(np.mean(values[seasonal_indices])))
            
            return {
                'success': True,
                'period': period,
                'seasonal_components': seasonal_components,
                'seasonal_pattern': seasonal_pattern,
                'seasonal_strength': seasonal_strength,
                'data_points': len(values)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _detect_seasonal_period(self, time_series: pd.Series, values: np.ndarray) -> Optional[int]:
        """Auto-detect seasonal period"""
        # Try common periods first
        common_periods = [7, 12, 24, 30, 365]  # daily, monthly, hourly, etc.
        
        for period in common_periods:
            if len(values) >= period * 2:
                # Check if this period makes sense
                if self._is_valid_seasonal_period(values, period):
                    return period
        
        # If no common period works, try to find one using autocorrelation
        max_lag = min(50, len(values) // 2)
        autocorr = [self._autocorrelation(values, lag) for lag in range(1, max_lag)]
        
        # Find peaks in autocorrelation
        for i in range(1, len(autocorr) - 1):
            if autocorr[i] > autocorr[i-1] and autocorr[i] > autocorr[i+1]:
                if autocorr[i] > 0.3:  # Threshold for significance
                    return i + 1
        
        return None
    
    def _is_valid_seasonal_period(self, values: np.ndarray, period: int) -> bool:
        """Check if a period is valid for seasonal analysis"""
        if len(values) < period * 2:
            return False
        
        # Calculate variance within seasons
        seasonal_variances = []
        for i in range(period):
            seasonal_indices = np.arange(i, len(values), period)
            if len(seasonal_indices) > 1:
                seasonal_var = np.var(values[seasonal_indices])
                seasonal_variances.append(seasonal_var)
        
        if not seasonal_variances:
            return False
        
        # Check if seasonal patterns are consistent
        avg_seasonal_var = np.mean(seasonal_variances)
        total_var = np.var(values)
        
        # Seasonal variance should be smaller than total variance
        return avg_seasonal_var < total_var * 0.8
    
    def _autocorrelation(self, values: np.ndarray, lag: int) -> float:
        """Calculate autocorrelation for a given lag"""
        if lag >= len(values):
            return 0
        
        mean_val = np.mean(values)
        numerator = np.sum((values[lag:] - mean_val) * (values[:-lag] - mean_val))
        denominator = np.sum((values - mean_val) ** 2)
        
        return numerator / denominator if denominator != 0 else 0
    
    def _calculate_seasonal_strength(self, values: np.ndarray, period: int) -> str:
        """Calculate seasonal strength"""
        if len(values) < period * 2:
            return 'insufficient_data'
        
        # Calculate seasonal and trend components (simplified)
        seasonal_var = 0
        for i in range(period):
            seasonal_indices = np.arange(i, len(values), period)
            if len(seasonal_indices) > 1:
                seasonal_var += np.var(values[seasonal_indices])
        
        seasonal_var /= period
        total_var = np.var(values)
        
        if total_var == 0:
            return 'no_variation'
        
        seasonal_ratio = seasonal_var / total_var
        
        if seasonal_ratio > 0.5:
            return 'strong'
        elif seasonal_ratio > 0.2:
            return 'moderate'
        else:
            return 'weak'
    
    def forecasting(self, column: str, periods: int = 10, method: str = 'linear') -> Dict[str, Any]:
        """
        Simple forecasting for time series data
        
        Args:
            column: Column to forecast
            periods: Number of periods to forecast
            method: Forecasting method ('linear', 'exponential', 'moving_average')
            
        Returns:
            Dictionary with forecasting results
        """
        if self.data is None or not self.time_column or column not in self.data.columns:
            return {'success': False, 'error': 'Invalid column or no time column'}
        
        try:
            # Prepare data
            ts_data = self.data[[self.time_column, column]].dropna()
            if len(ts_data) < 3:
                return {'success': False, 'error': 'Insufficient data for forecasting'}
            
            # Sort by time
            ts_data = ts_data.sort_values(self.time_column)
            values = ts_data[column].values
            
            forecast_values = []
            forecast_errors = []
            
            if method == 'linear':
                forecast_values, forecast_errors = self._linear_forecast(values, periods)
            elif method == 'exponential':
                forecast_values, forecast_errors = self._exponential_forecast(values, periods)
            elif method == 'moving_average':
                forecast_values, forecast_errors = self._moving_average_forecast(values, periods)
            else:
                return {'success': False, 'error': f'Unknown forecasting method: {method}'}
            
            # Generate future time points
            last_time = pd.to_datetime(ts_data[self.time_column].iloc[-1])
            time_diffs = pd.to_datetime(ts_data[self.time_column]).diff().dropna()
            avg_interval = time_diffs.mode().iloc[0] if not time_diffs.mode().empty else pd.Timedelta(days=1)
            
            future_times = [last_time + i * avg_interval for i in range(1, periods + 1)]
            
            return {
                'success': True,
                'method': method,
                'forecast_periods': periods,
                'forecast_values': [float(v) for v in forecast_values],
                'forecast_errors': [float(e) for e in forecast_errors],
                'future_times': [str(t) for t in future_times],
                'last_actual_value': float(values[-1]),
                'last_actual_time': str(last_time)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _linear_forecast(self, values: np.ndarray, periods: int) -> Tuple[np.ndarray, np.ndarray]:
        """Linear trend forecasting"""
        x = np.arange(len(values))
        y = values
        
        # Linear regression
        n = len(x)
        sum_x = np.sum(x)
        sum_y = np.sum(y)
        sum_xy = np.sum(x * y)
        sum_x2 = np.sum(x * x)
        
        slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x2 - sum_x * sum_x)
        intercept = (sum_y - slope * sum_x) / n
        
        # Forecast
        future_x = np.arange(len(values), len(values) + periods)
        forecast = slope * future_x + intercept
        
        # Simple error estimation (using standard error)
        y_pred = slope * x + intercept
        residuals = y - y_pred
        std_error = np.std(residuals)
        forecast_errors = np.full(periods, std_error)
        
        return forecast, forecast_errors
    
    def _exponential_forecast(self, values: np.ndarray, periods: int) -> Tuple[np.ndarray, np.ndarray]:
        """Exponential smoothing forecasting"""
        alpha = 0.3  # Smoothing parameter
        
        # Simple exponential smoothing
        smoothed = np.zeros_like(values)
        smoothed[0] = values[0]
        
        for i in range(1, len(values)):
            smoothed[i] = alpha * values[i] + (1 - alpha) * smoothed[i-1]
        
        # Forecast (constant forecast)
        forecast_value = smoothed[-1]
        forecast = np.full(periods, forecast_value)
        
        # Error estimation
        residuals = values - smoothed
        std_error = np.std(residuals)
        forecast_errors = np.full(periods, std_error)
        
        return forecast, forecast_errors
    
    def _moving_average_forecast(self, values: np.ndarray, periods: int, window: int = 3) -> Tuple[np.ndarray, np.ndarray]:
        """Moving average forecasting"""
        if len(values) < window:
            window = len(values)
        
        # Calculate moving average
        moving_avg = np.convolve(values, np.ones(window)/window, mode='valid')
        
        # Forecast (constant forecast)
        forecast_value = moving_avg[-1]
        forecast = np.full(periods, forecast_value)
        
        # Error estimation
        residuals = values[window-1:] - moving_avg
        std_error = np.std(residuals)
        forecast_errors = np.full(periods, std_error)
        
        return forecast, forecast_errors
    
    def decomposition(self, column: str, model: str = 'additive') -> Dict[str, Any]:
        """
        Decompose time series into trend, seasonal, and residual components
        
        Args:
            column: Column to decompose
            model: Decomposition model ('additive', 'multiplicative')
            
        Returns:
            Dictionary with decomposition results
        """
        if self.data is None or not self.time_column or column not in self.data.columns:
            return {'success': False, 'error': 'Invalid column or no time column'}
        
        try:
            # Prepare data
            ts_data = self.data[[self.time_column, column]].dropna()
            if len(ts_data) < 12:  # Need at least 12 points for meaningful decomposition
                return {'success': False, 'error': 'Insufficient data for decomposition'}
            
            # Sort by time
            ts_data = ts_data.sort_values(self.time_column)
            values = ts_data[column].values
            
            # Simple decomposition using moving averages
            window = min(7, len(values) // 4)  # Adaptive window size
            
            # Trend component (moving average)
            trend = np.convolve(values, np.ones(window)/window, mode='same')
            
            # Detrended series
            detrended = values - trend
            
            # Seasonal component (simplified - using periodic patterns)
            period = self._detect_seasonal_period(pd.to_datetime(ts_data[self.time_column]), values)
            if period and period < len(values) // 2:
                seasonal = np.zeros_like(values)
                for i in range(period):
                    indices = np.arange(i, len(values), period)
                    if len(indices) > 0:
                        seasonal[i::period] = np.mean(detrended[indices])
            else:
                seasonal = np.zeros_like(values)
            
            # Residual component
            if model == 'additive':
                residual = values - trend - seasonal
            else:  # multiplicative
                residual = values / (trend * (seasonal + 1))
            
            return {
                'success': True,
                'model': model,
                'original': values.tolist(),
                'trend': trend.tolist(),
                'seasonal': seasonal.tolist(),
                'residual': residual.tolist(),
                'period': period,
                'variance_explained': {
                    'trend': float(np.var(trend) / np.var(values)) if np.var(values) > 0 else 0,
                    'seasonal': float(np.var(seasonal) / np.var(values)) if np.var(values) > 0 else 0,
                    'residual': float(np.var(residual) / np.var(values)) if np.var(values) > 0 else 0
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

# Global instance for easy access
time_series_analyzer = TimeSeriesAnalyzer()