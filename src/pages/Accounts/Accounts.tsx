import React, { useState } from 'react';
import styles from './Accounts.module.scss';
import Filter, { type FilterOption } from '../../components/Filter';
import AccountSummary from '../../components/AccountSummary';
import portraits from '../../../public/data/portraits.json';

// --- Opciones para los filtros ---

const viewOptions: FilterOption[] = [
  { id: 'individual', label: 'individual', image: 'https://placehold.co/24x24/e81123/e81123.png' },
  { id: 'bloodline', label: 'bloodline', image: 'https://placehold.co/24x24/4a4a4a/ffffff.png?text=⠿' }
];

const filterOptions: FilterOption[] = [
  { id: 'obtained', label: 'obtained' },
  { id: 'skin', label: 'skin' },
  { id: 'mastery', label: 'mastery' },
  { id: 'mastery-level-up', label: 'mastery level up (1000p.)' },
  { id: 'type', label: 'type' },
  { id: 'pet-human', label: 'pet / human / humanoid / machine' },
  { id: 'favourite', label: 'favourite' },
];

const sortOptions: FilterOption[] = [
  { id: 'alphabetical', label: 'alphabetical' },
  { id: 'bloodline', label: 'bloodline' },
  { id: 'blue-essence', label: 'blue essence' },
];

const Accounts: React.FC = () => {
  // --- Estados para cada filtro ---
  const [selectedView, setSelectedView] = useState<string[]>(['individual']);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [selectedSorts, setSelectedSorts] = useState<string[]>(['alphabetical']);

  // --- Estado para la paginación ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(portraits.length / itemsPerPage);

  const currentAccounts = portraits.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.content__filters}>
          <Filter
            title="VIEW"
            options={viewOptions}
            selectedOptions={selectedView}
            onSelectionChange={setSelectedView}
          />
          <Filter
            title="FILTER"
            options={filterOptions}
            selectedOptions={selectedFilters}
            onSelectionChange={setSelectedFilters}
          />
          <Filter
            title="SORT BY"
            options={sortOptions}
            selectedOptions={selectedSorts}
            onSelectionChange={setSelectedSorts}
          />
        </div>
        <div className={styles.content}>
          <div className={styles.cards}>
            {currentAccounts.map((account) => (
              <AccountSummary key={account.name} data={account} />
            ))}
          </div>
          <div className={styles.pagination}>
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              &lt; Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              Next &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounts;