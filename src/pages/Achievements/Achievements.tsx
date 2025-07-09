import React, { useState } from 'react';
import styles from './Achievements.module.scss';
import AchievementCard from '../../components/AchievementCard';

interface Achievement {
    name: string;
    description: string;
    iconSrc: string;
    progress: number;
    completedSteps: number;
}

const achievements: Achievement[] = [
    {
        name: "Mastery Journey",
        description: "Take a champion from 0 to mastery 10",
        iconSrc: "/src/assets/images/masteries/mastery/10.png",
        progress: 100,
        completedSteps: 10
    },
    {
        name: "Skill Builder",
        description: "Level up champion masteries",
        iconSrc: "/src/assets/images/masteries/mastery/level_plate.png",
        progress: 100,
        completedSteps: 10
    },
    {
        name: "Battle Tested",
        description: "Play matches",
        iconSrc: "/src/assets/images/ranked-btn/mission.png",
        progress: 100,
        completedSteps: 10
    },
    {
        name: "Victory Seeker",
        description: "Win matches",
        iconSrc: "/src/assets/images/ranked-btn/wins.png",
        progress: 100,
        completedSteps: 10
    },
    {
        name: "First Blood",
        description: "Earn your first champion mastery",
        iconSrc: "/src/assets/images/masteries/mastery/1.png",
        progress: 100,
        completedSteps: 10
    },
    {
        name: "Rank Climber",
        description: "Advance to the next division",
        iconSrc: "/src/assets/images/lol-elements/tier-challenger.webp",
        progress: 100,
        completedSteps: 10
    },
    {
        name: "Tier Climber",
        description: "Ascend to a higher tier",
        iconSrc: "/src/assets/images/lol-elements/tier-challenger-heml.webp",
        progress: 100,
        completedSteps: 10
    },
    {
        name: "Majesty Collector",
        description: "Redeem majesty rewards",
        iconSrc: "/src/assets/images/ranked-btn/porveldam.png",
        progress: 100,
        completedSteps: 10
    },
    {
        name: "Victorious Warrior",
        description: "Win ranked games with victorious champions",
        iconSrc: "/src/assets/images/ranked-btn/gladasmy.png",
        progress: 100,
        completedSteps: 10
    }
];

const Achievements: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    // Calculate pagination
    const totalPages = Math.ceil(achievements.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAchievements = achievements.slice(startIndex, endIndex);

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };
    return (
        <div className={styles.achievements}>
            <div className={styles.achievements__container}>
                <header className={styles.achievements__header}>
                    <h1 className={styles.achievements__title}>Achievements</h1>
                    <p className={styles.achievements__subtitle}>Track your progress and unlock rewards</p>
                </header>

                <div className={styles.achievements__content}>
                    {currentAchievements.map((achievement) => (
                        <AchievementCard
                            key={achievement.name}
                            name={achievement.name}
                            description={achievement.description}
                            iconSrc={achievement.iconSrc}
                            progress={achievement.progress}
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