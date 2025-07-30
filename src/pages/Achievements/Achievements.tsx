import React, { useState } from 'react';
import styles from './Achievements.module.scss';
import AchievementCard from '../../components/AchievementCard';

interface Achievement {
    name: string;
    description: string;
    iconSrc: string;
    completedSteps: number;
    type: 'pet' | 'lol';
}

const achievements: Achievement[] = [
    {
        name: "Ascension",
        description: "Take a champion from 0 to mastery 10",
        iconSrc: "/images/masteries/mastery/10.png",
        completedSteps: 7,
        type: 'lol'
    },
    {
        name: "Artisan",
        description: "Level up champion masteries",
        iconSrc: "/images/masteries/mastery/level_plate.png",
        completedSteps: 3,
        type: 'lol'
    },
    {
        name: "Battlelord",
        description: "Play matches",
        iconSrc: "/images/ranked-btn/mission.png",
        completedSteps: 9,
        type: 'lol'
    },
    {
        name: "Victorious",
        description: "Win matches",
        iconSrc: "/images/ranked-btn/wins.png",
        completedSteps: 5,
        type: 'lol'
    },
    {
        name: "Initiate",
        description: "Obtain first blood",
        iconSrc: "/images/masteries/mastery/1.png",
        completedSteps: 1,
        type: 'lol'
    },
    {
        name: "Conqueror",
        description: "Advance to the next division",
        iconSrc: "/images/lol-elements/tier-challenger.webp",
        completedSteps: 8,
        type: 'lol'
    },
    {
        name: "Champion",
        description: "Ascend to a higher tier",
        iconSrc: "/images/lol-elements/tier-challenger-heml.webp",
        completedSteps: 4,
        type: 'lol'
    },
    {
        name: "Majesty",
        description: "Redeem majesty accounts",
        iconSrc: "/images/ranked-btn/porveldam.png",
        completedSteps: 6,
        type: 'lol'
    },
    {
        name: "Warrior",
        description: "Win victorious champion ranked games",
        iconSrc: "/images/ranked-btn/gladasmy.png",
        completedSteps: 2,
        type: 'lol'
    },
    {
        name: "Guardian",
        description: "Pet your pet",
        iconSrc: "/images/achievement/achievement-10-1.png",
        completedSteps: 10,
        type: 'pet'
    },
    {
        name: "Companion",
        description: "Play games in premade",
        iconSrc: "/images/achievement/achievement-11-1.png",
        completedSteps: 3,
        type: 'pet'
    },
    {
        name: "Questmaster",
        description: "Complete missions",
        iconSrc: "/images/achievement/achievement-12-1.png",
        completedSteps: 7,
        type: 'pet'
    }
];

const Achievements: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [activeTab, setActiveTab] = useState<'pet' | 'lol'>('lol');
    const itemsPerPage = 4;

    // Filter achievements based on active tab
    const filteredAchievements = achievements.filter(achievement => achievement.type === activeTab);

    // Calculate pagination for filtered achievements
    const totalPages = Math.ceil(filteredAchievements.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAchievements = filteredAchievements.slice(startIndex, endIndex);

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleTabChange = (tab: 'pet' | 'lol') => {
        setActiveTab(tab);
        setCurrentPage(1); // Reset to first page when changing tabs
    };

    return (
        <div className={styles.achievements}>
            <div className={styles.tabContainer}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'pet' ? styles.active : ''}`}
                    onClick={() => handleTabChange('pet')}
                >
                    Pet
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'lol' ? styles.active : ''}`}
                    onClick={() => handleTabChange('lol')}
                >
                    LoL
                </button>
            </div>
            <div className={styles.achievements__container}>
                <div className={styles.achievements__content}>
                    {currentAchievements.map((achievement) => (
                        <AchievementCard
                            key={achievement.name}
                            name={achievement.name}
                            description={achievement.description}
                            iconSrc={achievement.iconSrc}
                            completedSteps={achievement.completedSteps}
                        />
                    ))}
                </div>
                <div className={styles.pagination}>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        &lt; Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next &gt;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Achievements; 