const URL = 'http://127.0.0.1:3000/';
const totalTrips = document.getElementById('TotalTrips');
const highSpeed = document.getElementById('HighSpeed');
const longDistance = document.getElementById('Longdistance');
const select = document.getElementById('dataSelect');
const filterDay = document.getElementById('filterDay');
const filterDate = document.getElementById('filterDate');
const resultsDiv = document.getElementById('results');
const highDuration = document.getElementById('high_duration');

let allTripsData = []; // Store all data for client-side filtering

// Debounce function to limit filtering calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show/hide loading spinner
function toggleLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

// Initial data fetch
function fetchInitialData() {
    toggleLoading(true);
    
    fetch(`${URL}api/trips`)
        .then(res => res.json())
        .then(data => {
            allTripsData = data; // Store all data
            updateDashboardStats(data);
            populateSelectOptions(data);
            filterAndDisplayResults(); // Display initial results
        })
        .catch(err => {
            console.error('Error fetching trips:', err);
            displayError('Failed to load data. Please try again.');
        })
        .finally(() => {
            toggleLoading(false);
        });
}

// Update dashboard statistics
function updateDashboardStats(data) {
    totalTrips.innerText = data.length;

    const highestSpeed = Math.max(...data.map(trip => trip.trip_speed_kmh || 0));
    highSpeed.innerText = `${highestSpeed} km/h`;

    const longestDuration = Math.max(...data.map(trip => trip.trip_duration || 0));
    longDistance.innerText = `${longestDuration} sec`;
    
    const longestTrip = Math.max(...data.map(trip => trip.trip_distance_km || 0));
    highDuration.innerText = `${longestTrip} km`;
}

// Populate select dropdown with column options
function populateSelectOptions(data) {
    if (data.length > 0) {
        const keys = [        
            "dropoff_datetime",
            "dropoff_latitude",
            "dropoff_longitude",
            "passenger_count",
            "pickup_datetime", 
            "pickup_day_of_week",
            "pickup_latitude",
            "pickup_longitude",
            "pickup_month",
            "pickup_time",
            "trip_distance_category",
            "trip_distance_km",
            "trip_duration",
            "trip_speed_kmh"
        ];

        // Clear existing options
        select.innerHTML = '';

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select data type';
        select.appendChild(defaultOption);

        // Add each key as an option
        keys.forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            select.appendChild(option);
        });
    } else {
        select.innerHTML = '<option>No data found</option>';
    }
}

// Filter data based on input values
function filterAndDisplayResults() {
    const filterValue = filterDay.value.toLowerCase().trim();
    const dataType = select.value;
    const dateValue = filterDate.value;
    
    let filteredData = [...allTripsData];

    // Filter by day of week
    if (filterValue) {
        filteredData = filteredData.filter(trip => {
            const dayOfWeek = trip.pickup_day_of_week?.toLowerCase() || '';
            return dayOfWeek.includes(filterValue);
        });
    }

    // Filter by date
    if (dateValue) {
        filteredData = filteredData.filter(trip => {
            const tripDate = trip.pickup_datetime?.split(' ')[0] || '';
            return tripDate === dateValue;
        });
    }

    // Update stats with filtered data
    updateDashboardStats(filteredData);
    updateChart(filteredData);
    updatePieChart(filteredData);

    // Display results
    displayResults(filteredData, dataType);
}

// Display results in a table   
// Pagination variables
let currentPage = 1;
const rowsPerPage = 20; // change to 50, 100, etc.

function displayResults(data, selectedColumn = '') {
    const totalPages = Math.ceil(data.length / rowsPerPage);

    // Adjust current page if it exceeds available pages
    if (currentPage > totalPages) currentPage = totalPages || 1;

    if (!data || data.length === 0) {
        resultsDiv.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293
                        l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4">
                    </path>
                </svg>
                <p class="text-lg font-medium">No results found</p>
                <p class="text-sm mt-1">Try adjusting your filters</p>
            </div>
        `;
        return;
    }

    // Determine which columns to show
    let columnsToShow;
    if (selectedColumn && selectedColumn !== '') {
        columnsToShow = ['pickup_day_of_week', 'pickup_datetime', selectedColumn];
    } else {
        columnsToShow = [
            'pickup_day_of_week',
            'pickup_datetime',
            'trip_distance_km',
            'trip_duration',
            'trip_speed_kmh',
            'passenger_count'
        ];
    }

    // Calculate slice for current page
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    // Create table
    const tableHTML = `
        <div class="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gradient-to-r from-blue-50 to-purple-50">
                    <tr>
                        <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">#</th>
                        ${columnsToShow.map(key => `
                            <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                ${key.replace(/_/g, ' ')}
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${paginatedData.map((row, index) => `
                        <tr class="hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-gray-50' : ''}">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                ${startIndex + index + 1}
                            </td>
                            ${columnsToShow.map(key => `
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    ${formatCellValue(row[key], key)}
                                </td>
                            `).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="mt-4 flex justify-center items-center space-x-2">
            <button id="prevPage" class="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}">Previous</button>
            <span class="text-sm text-gray-600">Page ${currentPage} of ${totalPages}</span>
            <button id="nextPage" class="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}">Next</button>
        </div>

        <div class="mt-2 text-xs text-gray-500 text-center">
            Showing ${startIndex + 1}-${Math.min(endIndex, data.length)} of ${data.length} results
        </div>
    `;
    
    resultsDiv.innerHTML = tableHTML;

    // Add event listeners for pagination
    document.getElementById('prevPage')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayResults(data, selectedColumn);
        }
    });

    document.getElementById('nextPage')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayResults(data, selectedColumn);
        }
    });
}
// ===============================
// Chart.js: Dynamic Chart Section
// ===============================

let tripChart = null;

function updateChart(data) {
    const ctx = document.getElementById('tripChart').getContext('2d');

    // If a chart already exists, destroy it to update properly
    if (tripChart) {
        tripChart.destroy();
    }

    // Prepare chart data (e.g., average trip speed by day of week)
    const grouped = {};

    data.forEach(trip => {
        const day = trip.pickup_day_of_week || 'Unknown';
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(trip.trip_speed_kmh || 0);
    });

    const labels = Object.keys(grouped);
    const avgSpeeds = labels.map(day => {
        const values = grouped[day];
        return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;
    });

    // Create chart
    tripChart = new Chart(ctx, {
        type: 'bar', // Try 'line' or 'pie' too
        data: {
            labels,
            datasets: [{
                label: 'Average Trip Speed (km/h)',
                data: avgSpeeds,
                backgroundColor: 'rgba(59, 130, 246, 0.6)', // blue
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 1,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, position: 'bottom' },
                tooltip: { enabled: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Speed (km/h)' }
                },
                x: {
                    title: { display: true, text: 'Day of Week' }
                }
            }
        }
    });
}
// ===== PIE CHART SECTION =====
let tripPieChart;

function updatePieChart(data) {
  const ctx = document.getElementById("tripPieChart").getContext("2d");
  if (tripPieChart) tripPieChart.destroy();

  // Count trips by day of week
  const counts = {};
  data.forEach(t => {
    const day = t.pickup_day_of_week || "Unknown";
    counts[day] = (counts[day] || 0) + 1;
  });

  const labels = Object.keys(counts);
  const values = Object.values(counts);

  tripPieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        label: "Trips by Day",
        data: values,
        backgroundColor: [
          "rgba(59,130,246,0.7)",
          "rgba(99,102,241,0.7)",
          "rgba(139,92,246,0.7)",
          "rgba(236,72,153,0.7)",
          "rgba(234,179,8,0.7)",
          "rgba(16,185,129,0.7)",
          "rgba(239,68,68,0.7)"
        ],
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        legend: { position: "bottom" },
        tooltip: { enabled: true }
      }
    }
  });
}

// Format cell values for better display
function formatCellValue(value, key) {
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    
    // Format numbers
    if (typeof value === 'number') {
        if (key.includes('latitude') || key.includes('longitude')) {
            return value.toFixed(6);
        }
        if (key.includes('distance')) {
            return value.toFixed(2);
        }
        return value.toLocaleString();
    }
    
    return value;
}

// Display error message
function displayError(message) {
    resultsDiv.innerHTML = `
        <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div class="flex items-center">
                <svg class="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-red-700 font-medium">${message}</p>
            </div>
        </div>
    `;
}

// Debounced filter function
const debouncedFilter = debounce(() => {
    filterAndDisplayResults();
}, 300);

// Event listeners for real-time filtering
filterDay.addEventListener('input', debouncedFilter);
select.addEventListener('change', debouncedFilter);
filterDate.addEventListener('change', debouncedFilter);

// Download CSV functionality
document.getElementById('downloadBtn').addEventListener('click', () => {
    const filterValue = filterDay.value.toLowerCase().trim();
    const dateValue = filterDate.value;
    
    let filteredData = [...allTripsData];

    // Apply same filters
    if (filterValue) {
        filteredData = filteredData.filter(trip => {
            const dayOfWeek = trip.pickup_day_of_week?.toLowerCase() || '';
            return dayOfWeek.includes(filterValue);
        });
    }

    if (dateValue) {
        filteredData = filteredData.filter(trip => {
            const tripDate = trip.pickup_datetime?.split(' ')[0] || '';
            return tripDate === dateValue;
        });
    }

    // Convert to CSV
    if (filteredData.length === 0) {
        alert('No data to download');
        return;
    }

    const headers = Object.keys(filteredData[0]);
    const csvContent = [
        headers.join(','),
        ...filteredData.map(row => 
            headers.map(header => {
                const value = row[header];
                // Escape values that contain commas or quotes
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value ?? '';
            }).join(',')
        )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mobility-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
});

// Initialize on page load
fetchInitialData();