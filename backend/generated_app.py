import streamlit as st
import pandas as pd
import numpy as np

# Create dummy DataFrame
data = {
    'Name': ['John', 'Jane', 'Bob', 'Alice', 'Tom'],
    'Age': [30, 25, 35, 28, 32],
    'City': ['New York', 'Los Angeles', 'Chicago', 'San Francisco', 'Seattle'],
    'Salary': [50000, 60000, 45000, 55000, 65000]
}

df = pd.DataFrame(data)

# Streamlit application
st.title("Dummy Data Application")

st.subheader("Data Preview")
st.dataframe(df)

st.sidebar.markdown("---")
st.sidebar.subheader("📥 Export Code")

import inspect
source_code = inspect.getsource(inspect.getmodule(inspect.currentframe()))

st.sidebar.download_button(
    label="Download app.py",
    data=source_code,
    file_name="app.py",
    mime="text/x-python"
)