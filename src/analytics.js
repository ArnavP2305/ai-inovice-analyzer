// analytics.js
// Handles fetching data from the API and rendering Chart.js charts

class AnalyticsDashboard {
    constructor() {
        this.ctxSpending = document.getElementById('spendingChart');
        this.ctxTax = document.getElementById('taxChart');
        this.spendingChart = null;
        this.taxChart = null;
    }

    async loadData() {
        const token = localStorage.getItem('invoiceai_token');
        if (!token) return;

        try {
            const res = await fetch('/api/analytics', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to fetch analytics');
            
            const data = await res.json();
            this.renderCharts(data);
            this.renderKPIs(data);
        } catch (err) {
            console.error('Analytics error:', err);
        }
    }

    renderKPIs(data) {
        document.getElementById('kpi-total-spent').innerText = `₹ ${data.total_spent.toFixed(2)}`;
        document.getElementById('kpi-total-tax').innerText = `₹ ${data.total_tax.toFixed(2)}`;
    }

    renderCharts(data) {
        if (this.spendingChart) this.spendingChart.destroy();
        if (this.taxChart) this.taxChart.destroy();

        if (!this.ctxSpending || !this.ctxTax) return;

        const months = Object.keys(data.monthly_data).sort();
        const amounts = months.map(m => data.monthly_data[m]);

        // Spending Bar Chart
        this.spendingChart = new Chart(this.ctxSpending, {
            type: 'bar',
            data: {
                labels: months.length ? months : ['No Data'],
                datasets: [{
                    label: 'Total Spending (₹)',
                    data: amounts.length ? amounts : [0],
                    backgroundColor: 'rgba(56, 189, 248, 0.6)',
                    borderColor: 'rgba(56, 189, 248, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // Tax Pie Chart (Total Spent vs Total Tax)
        this.taxChart = new Chart(this.ctxTax, {
            type: 'doughnut',
            data: {
                labels: ['Base Amount', 'Tax Amount'],
                datasets: [{
                    data: [data.total_spent - data.total_tax, data.total_tax],
                    backgroundColor: ['#38bdf8', '#818cf8'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true
            }
        });
    }
}

window.AnalyticsBoard = new AnalyticsDashboard();
