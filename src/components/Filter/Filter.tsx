import React, { useState } from 'react';
import styles from './Filter.module.scss';

// Define la estructura de cada opción del filtro
export interface FilterOption {
    id: string;
    label: string;
    image?: string; // La imagen es opcional
}

// Define las propiedades que recibirá el componente
interface FilterProps {
    title: string;
    options: FilterOption[];
    selectedOptions: string[];
    onSelectionChange: (selectedIds: string[]) => void;
}

const Filter: React.FC<FilterProps> = ({ title, options, selectedOptions, onSelectionChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleCheckboxChange = (optionId: string) => {
        // Si la opción ya está seleccionada, la quita. Si no, la agrega.
        const newSelection = selectedOptions.includes(optionId)
            ? selectedOptions.filter((id) => id !== optionId)
            : [...selectedOptions, optionId];

        onSelectionChange(newSelection);
    };

    return (
        <div className={styles.container}>
            <button className={styles.header} onClick={handleToggle}>
                <span>{title}</span>
                <span className={`${styles.arrow} ${isOpen ? styles.open : ''}`}>▼</span>
            </button>
            <div className={`${styles.collapsible} ${isOpen ? styles.open : ''}`}>
                <div className={styles.optionsList}>
                    {options.map((option) => (
                        <label key={option.id} className={styles.optionItem}>
                            <input
                                type="checkbox"
                                checked={selectedOptions.includes(option.id)}
                                onChange={() => handleCheckboxChange(option.id)}
                            />
                            <span className={styles.checkboxCustom}></span>
                            {option.image && <img src={option.image} alt={option.label} className={styles.optionImage} />}
                            <span className={styles.optionLabel}>{option.label}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Filter; 