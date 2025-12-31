
import fs from 'fs';
import path from 'path';

export function generarDashboardHTML(jsonPath: string, outputPath: string) {
    if (!fs.existsSync(jsonPath)) {
        console.error('No se encontró el archivo de progreso para generar el dashboard.');
        return;
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const total = data.length;
    const ok = data.filter((m: any) => m['Coinciden?'] === 'SÍ').length;
    const fallos = total - ok;
    const porcentaje = total > 0 ? ((ok / total) * 100).toFixed(1) : 0;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard BUC V6 - Validación Cruzada</title>
    <style>
        :root {
            --primary: #2563eb;
            --success: #16a34a;
            --danger: #dc2626;
            --bg: #f8fafc;
            --card: #ffffff;
        }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg); margin: 0; padding: 20px; color: #1e293b; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: var(--card); padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .stat-val { font-size: 2rem; font-weight: bold; margin: 10px 0; }
        .ok { color: var(--success); }
        .fail { color: var(--danger); }
        table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        th { background: #f1f5f9; padding: 15px; text-align: left; font-size: 0.875rem; text-transform: uppercase; color: #64748b; }
        td { padding: 15px; border-top: 1px solid #e2e8f0; font-size: 0.9rem; }
        .badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: bold; }
        .badge-ok { background: #dcfce7; color: #166534; }
        .badge-fail { background: #fee2e2; color: #991b1b; }
        tr:hover { background: #f8fafc; }
        .search-row { margin-bottom: 20px; }
        #searchInput { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Reporte Validación BUC V6</h1>
            <p>Última actualización: ${new Date().toLocaleString()}</p>
        </div>

        <div class="stats">
            <div class="card">
                <div style="color: #64748b">Total Procesados</div>
                <div class="stat-val">${total}</div>
            </div>
            <div class="card">
                <div style="color: var(--success)">Matches (OK)</div>
                <div class="stat-val ok">${ok}</div>
            </div>
            <div class="card">
                <div style="color: var(--danger)">Fallos</div>
                <div class="stat-val fail">${fallos}</div>
            </div>
            <div class="card">
                <div style="color: var(--primary)">Efectividad</div>
                <div class="stat-val" style="color: var(--primary)">${porcentaje}%</div>
            </div>
        </div>

        <div class="search-row">
            <input type="text" id="searchInput" placeholder="Buscar por RUT o Nombre..." onkeyup="filterTable()">
        </div>

        <table id="resultsTable">
            <thead>
                <tr>
                    <th>RUT</th>
                    <th>Nombre Planilla</th>
                    <th>Encontrado (ANON)</th>
                    <th>Encontrado (NO ANON)</th>
                    <th>Estado</th>
                    <th>Obs.</th>
                </tr>
            </thead>
            <tbody>
                ${data.map((r: any) => `
                <tr>
                    <td><strong>${r.RUT}</strong></td>
                    <td>${r['Nombre Esperado (Planilla)']}</td>
                    <td>${r['N. Encontrado (ANON)']}</td>
                    <td>${r['N. Encontrado (NO ANON)']}</td>
                    <td><span class="badge ${r['Coinciden?'] === 'SÍ' ? 'badge-ok' : 'badge-fail'}">${r['Coinciden?']}</span></td>
                    <td>${r.Observaciones}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <script>
        function filterTable() {
            const input = document.getElementById('searchInput');
            const filter = input.value.toUpperCase();
            const table = document.getElementById('resultsTable');
            const tr = table.getElementsByTagName('tr');

            for (let i = 1; i < tr.length; i++) {
                const tds = tr[i].getElementsByTagName('td');
                let found = false;
                for(let j=0; j<tds.length; j++) {
                    if (tds[j].textContent.toUpperCase().indexOf(filter) > -1) {
                        found = true;
                        break;
                    }
                }
                tr[i].style.display = found ? "" : "none";
            }
        }
    </script>
</body>
</html>
    `;

    fs.writeFileSync(outputPath, html);
    console.log(`✅ Dashboard HTML generado en: ${outputPath}`);
}

// CLI execution
if (require.main === module) {
    const jsonPath = process.argv[2] || 'evidencias/PROGRESO_V6.json';
    const outputPath = process.argv[3] || 'evidencias/DASHBOARD_V6.html';
    generarDashboardHTML(jsonPath, outputPath);
}
