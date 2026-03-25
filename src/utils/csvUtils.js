/**
 * Utility to export data to CSV and trigger download
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the file to save as
 * @param {Array} headers - Optional array of header mapping {key: 'field', label: 'Header Label'}
 */
export const exportToCSV = (data, filename = 'export.csv', headers = null) => {
    if (!data || !data.length) {
        console.error('No data to export');
        return false;
    }

    let csvContent = '';
    
    // Determine headers
    const keys = headers ? headers.map(h => h.key) : Object.keys(data[0]);
    const labels = headers ? headers.map(h => h.label) : keys;
    
    // Add header row
    csvContent += labels.join(',') + '\n';
    
    // Add data rows
    data.forEach(item => {
        const row = keys.map(key => {
            let value = item[key];
            
            // Handle special cases
            if (value === null || value === undefined) {
                value = '';
            } else if (typeof value === 'object') {
                // For nested objects like address, try to stringify or pick a useful field
                if (key === 'shippingAddress' && value.streetAddress) {
                    value = `${value.streetAddress}, ${value.city}, ${value.state}`;
                } else {
                    value = JSON.stringify(value).replace(/"/g, '""');
                }
            } else if (typeof value === 'string') {
                // Escape quotes and wrap in quotes if contains comma
                value = value.replace(/"/g, '""');
                if (value.includes(',') || value.includes('\n')) {
                    value = `"${value}"`;
                }
            }
            
            return value;
        });
        csvContent += row.join(',') + '\n';
    });
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return true;
    }
    
    return false;
};
