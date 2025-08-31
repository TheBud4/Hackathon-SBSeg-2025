document.addEventListener('DOMContentLoaded', function() {
    fetchAssets();
});

async function fetchAssets() {
    try {
        const response = await fetch('http://localhost:5000/assets');
        const data = await response.json();
        const assets = data.assets;

        // Group by product
        const productGroups = {};
        assets.forEach(asset => {
            if (!productGroups[asset.product]) {
                productGroups[asset.product] = [];
            }
            productGroups[asset.product].push(asset);
        });

        // Calculate average priority score per product
        const labels = [];
        const scores = [];
        Object.keys(productGroups).forEach(product => {
            const group = productGroups[product];
            const avgScore = group.reduce((sum, a) => sum + a.priority_score, 0) / group.length;
            labels.push(product);
            scores.push(avgScore);
        });

        // Render chart
        renderChart(labels, scores);

        // Render table
        renderTable(assets);
    } catch (error) {
        console.error('Error fetching assets:', error);
    }
}

function renderChart(labels, scores) {
    const ctx = document.getElementById('priorityChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Priority Score',
                data: scores,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

function renderTable(assets) {
    const tbody = document.querySelector('#assetsTable tbody');
    tbody.innerHTML = '';
    assets.forEach(asset => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${asset.product}</td>
            <td>${asset.name}</td>
            <td>${asset.version}</td>
            <td>${asset.priority_score.toFixed(2)}</td>
            <td>${asset.vulnerabilities_count}</td>
        `;
        tbody.appendChild(row);
    });
}
