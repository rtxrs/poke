// @ts-nocheck
document.addEventListener('DOMContentLoaded', () => {
    const rankingsGrid = document.getElementById('rankings-grid');

    rankingsGrid.addEventListener('click', (event) => {
        const target = event.target;
        const rankingColumn = target.closest('.ranking-column');

        if (!rankingColumn) {
            return;
        }

        const tableContainer = rankingColumn.querySelector('.table-container');

        if (target.classList.contains('show-more-btn')) {
            rankingColumn.classList.add('expanded');
            if (tableContainer) {
                tableContainer.classList.add('expanded');
            }
        }

        if (target.classList.contains('show-less-btn')) {
            rankingColumn.classList.remove('expanded');
            if (tableContainer) {
                tableContainer.classList.remove('expanded');
            }
        }
    });
});