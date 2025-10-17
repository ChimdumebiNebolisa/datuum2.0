"""
Data processing module for Datuum 2.0
Handles CSV/Excel/JSON parsing, cleaning, validation, and transformation
"""

import pandas as pd
import numpy as np
import json
from typing import Dict, List, Any, Optional, Union
import io
import base64

class DataProcessor:
    def __init__(self):
        self.df = None
        self.original_df = None
        
    def load_data(self, data: Union[str, List[Dict], pd.DataFrame], 
                  file_type: str = 'csv', **kwargs) -> Dict[str, Any]:
        """
        Load data from various sources
        
        Args:
            data: Data to load (string for CSV/JSON, list of dicts, or DataFrame)
            file_type: Type of file ('csv', 'json', 'excel', 'dataframe')
            **kwargs: Additional parameters for pandas read functions
            
        Returns:
            Dictionary with success status, data info, and any errors
        """
        try:
            if file_type == 'csv':
                if isinstance(data, str):
                    self.df = pd.read_csv(io.StringIO(data), **kwargs)
                else:
                    self.df = pd.DataFrame(data)
            elif file_type == 'json':
                if isinstance(data, str):
                    json_data = json.loads(data)
                    self.df = pd.json_normalize(json_data)
                else:
                    self.df = pd.DataFrame(data)
            elif file_type == 'excel':
                if isinstance(data, bytes):
                    self.df = pd.read_excel(io.BytesIO(data), **kwargs)
                else:
                    self.df = pd.DataFrame(data)
            elif file_type == 'dataframe':
                self.df = pd.DataFrame(data)
            else:
                raise ValueError(f"Unsupported file type: {file_type}")
            
            # Store original for reset functionality
            self.original_df = self.df.copy()
            
            return {
                'success': True,
                'shape': self.df.shape,
                'columns': self.df.columns.tolist(),
                'dtypes': self.df.dtypes.astype(str).to_dict(),
                'missing_values': self.df.isnull().sum().to_dict(),
                'memory_usage': self.df.memory_usage(deep=True).sum()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def clean_data(self, operations: List[str] = None) -> Dict[str, Any]:
        """
        Clean the dataset with various operations
        
        Args:
            operations: List of cleaning operations to perform
            
        Returns:
            Dictionary with cleaning results and statistics
        """
        if self.df is None:
            return {'success': False, 'error': 'No data loaded'}
        
        try:
            original_shape = self.df.shape
            operations_performed = []
            
            if operations is None:
                operations = [
                    'remove_duplicates',
                    'handle_missing_values',
                    'standardize_columns',
                    'convert_types'
                ]
            
            # Remove duplicates
            if 'remove_duplicates' in operations:
                before_duplicates = len(self.df)
                self.df = self.df.drop_duplicates()
                after_duplicates = len(self.df)
                if before_duplicates != after_duplicates:
                    operations_performed.append(f"Removed {before_duplicates - after_duplicates} duplicate rows")
            
            # Handle missing values
            if 'handle_missing_values' in operations:
                missing_before = self.df.isnull().sum().sum()
                
                # Fill numeric columns with median
                numeric_columns = self.df.select_dtypes(include=[np.number]).columns
                for col in numeric_columns:
                    if self.df[col].isnull().any():
                        self.df[col].fillna(self.df[col].median(), inplace=True)
                
                # Fill categorical columns with mode
                categorical_columns = self.df.select_dtypes(include=['object']).columns
                for col in categorical_columns:
                    if self.df[col].isnull().any():
                        mode_value = self.df[col].mode()
                        if not mode_value.empty:
                            self.df[col].fillna(mode_value[0], inplace=True)
                        else:
                            self.df[col].fillna('Unknown', inplace=True)
                
                missing_after = self.df.isnull().sum().sum()
                if missing_before > missing_after:
                    operations_performed.append(f"Handled {missing_before - missing_after} missing values")
            
            # Standardize column names
            if 'standardize_columns' in operations:
                self.df.columns = self.df.columns.str.strip().str.lower().str.replace(' ', '_')
                operations_performed.append("Standardized column names")
            
            # Convert data types
            if 'convert_types' in operations:
                for col in self.df.columns:
                    # Try to convert to numeric
                    if self.df[col].dtype == 'object':
                        try:
                            self.df[col] = pd.to_numeric(self.df[col], errors='ignore')
                        except:
                            pass
                    
                    # Try to convert to datetime
                    if self.df[col].dtype == 'object':
                        try:
                            self.df[col] = pd.to_datetime(self.df[col], errors='ignore')
                        except:
                            pass
            
            return {
                'success': True,
                'original_shape': original_shape,
                'new_shape': self.df.shape,
                'operations_performed': operations_performed,
                'columns': self.df.columns.tolist(),
                'dtypes': self.df.dtypes.astype(str).to_dict()
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def transform_data(self, transformations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Apply various data transformations
        
        Args:
            transformations: List of transformation dictionaries
            
        Returns:
            Dictionary with transformation results
        """
        if self.df is None:
            return {'success': False, 'error': 'No data loaded'}
        
        try:
            transformations_applied = []
            
            for transform in transformations:
                transform_type = transform.get('type')
                column = transform.get('column')
                params = transform.get('params', {})
                
                if transform_type == 'rename_column':
                    old_name = column
                    new_name = params.get('new_name')
                    if old_name in self.df.columns:
                        self.df.rename(columns={old_name: new_name}, inplace=True)
                        transformations_applied.append(f"Renamed '{old_name}' to '{new_name}'")
                
                elif transform_type == 'delete_column':
                    if column in self.df.columns:
                        self.df.drop(columns=[column], inplace=True)
                        transformations_applied.append(f"Deleted column '{column}'")
                
                elif transform_type == 'filter_rows':
                    condition = params.get('condition')
                    if condition:
                        # Simple filter implementation
                        filtered_df = self.df.query(condition)
                        self.df = filtered_df
                        transformations_applied.append(f"Applied filter: {condition}")
                
                elif transform_type == 'sort_by':
                    ascending = params.get('ascending', True)
                    self.df.sort_values(by=column, ascending=ascending, inplace=True)
                    transformations_applied.append(f"Sorted by '{column}' ({'ascending' if ascending else 'descending'})")
                
                elif transform_type == 'group_by':
                    agg_columns = params.get('agg_columns', [])
                    agg_functions = params.get('agg_functions', ['mean'])
                    
                    if agg_columns:
                        grouped = self.df.groupby(column)[agg_columns].agg(agg_functions)
                        self.df = grouped.reset_index()
                        transformations_applied.append(f"Grouped by '{column}' with aggregation")
            
            return {
                'success': True,
                'transformations_applied': transformations_applied,
                'new_shape': self.df.shape,
                'columns': self.df.columns.tolist()
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_data_info(self) -> Dict[str, Any]:
        """
        Get comprehensive information about the current dataset
        
        Returns:
            Dictionary with dataset information
        """
        if self.df is None:
            return {'success': False, 'error': 'No data loaded'}
        
        try:
            info = {
                'success': True,
                'shape': self.df.shape,
                'columns': self.df.columns.tolist(),
                'dtypes': self.df.dtypes.astype(str).to_dict(),
                'missing_values': self.df.isnull().sum().to_dict(),
                'memory_usage': self.df.memory_usage(deep=True).sum(),
                'sample_data': self.df.head(10).to_dict('records')
            }
            
            # Add column-specific information
            column_info = {}
            for col in self.df.columns:
                col_data = self.df[col]
                col_info = {
                    'dtype': str(col_data.dtype),
                    'null_count': col_data.isnull().sum(),
                    'unique_count': col_data.nunique()
                }
                
                if pd.api.types.is_numeric_dtype(col_data):
                    col_info.update({
                        'min': float(col_data.min()) if not col_data.empty else None,
                        'max': float(col_data.max()) if not col_data.empty else None,
                        'mean': float(col_data.mean()) if not col_data.empty else None,
                        'std': float(col_data.std()) if not col_data.empty else None
                    })
                elif pd.api.types.is_datetime64_any_dtype(col_data):
                    col_info.update({
                        'min_date': str(col_data.min()) if not col_data.empty else None,
                        'max_date': str(col_data.max()) if not col_data.empty else None
                    })
                
                column_info[col] = col_info
            
            info['column_details'] = column_info
            return info
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def export_data(self, format: str = 'csv') -> Dict[str, Any]:
        """
        Export the current dataset
        
        Args:
            format: Export format ('csv', 'json', 'excel')
            
        Returns:
            Dictionary with export result and data
        """
        if self.df is None:
            return {'success': False, 'error': 'No data loaded'}
        
        try:
            if format == 'csv':
                output = self.df.to_csv(index=False)
            elif format == 'json':
                output = self.df.to_json(orient='records', date_format='iso')
            elif format == 'excel':
                output_buffer = io.BytesIO()
                self.df.to_excel(output_buffer, index=False)
                output = base64.b64encode(output_buffer.getvalue()).decode()
            else:
                raise ValueError(f"Unsupported export format: {format}")
            
            return {
                'success': True,
                'format': format,
                'data': output,
                'shape': self.df.shape
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def reset_data(self) -> Dict[str, Any]:
        """
        Reset data to original state
        
        Returns:
            Dictionary with reset result
        """
        if self.original_df is None:
            return {'success': False, 'error': 'No original data to reset to'}
        
        try:
            self.df = self.original_df.copy()
            return {
                'success': True,
                'message': 'Data reset to original state',
                'shape': self.df.shape
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

# Global instance for easy access
data_processor = DataProcessor()