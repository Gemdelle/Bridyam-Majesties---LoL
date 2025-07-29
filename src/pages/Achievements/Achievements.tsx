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
        iconSrc: "/images/masteries/mastery/10.png",
        progress: 100,
        completedSteps: 7
    },
    {
        name: "Skill Builder",
        description: "Level up champion masteries",
        iconSrc: "/images/masteries/mastery/level_plate.png",
        progress: 100,
        completedSteps: 3
    },
    {
        name: "Battle Tested",
        description: "Play matches",
        iconSrc: "/images/ranked-btn/mission.png",
        progress: 100,
        completedSteps: 9
    },
    {
        name: "Victory Seeker",
        description: "Win matches",
        iconSrc: "/images/ranked-btn/wins.png",
        progress: 100,
        completedSteps: 5
    },
    {
        name: "First Blood",
        description: "Earn your first champion mastery",
        iconSrc: "/images/masteries/mastery/1.png",
        progress: 100,
        completedSteps: 1
    },
    {
        name: "Rank Climber",
        description: "Advance to the next division",
        iconSrc: "/images/lol-elements/tier-challenger.webp",
        progress: 100,
        completedSteps: 8
    },
    {
        name: "Tier Climber",
        description: "Ascend to a higher tier",
        iconSrc: "/images/lol-elements/tier-challenger-heml.webp",
        progress: 100,
        completedSteps: 4
    },
    {
        name: "Majesty Collector",
        description: "Redeem majesty rewards",
        iconSrc: "/images/ranked-btn/porveldam.png",
        progress: 100,
        completedSteps: 6
    },
    {
        name: "Victorious Warrior",
        description: "Win ranked games with victorious champions",
        iconSrc: "/images/ranked-btn/gladasmy.png",
        progress: 100,
        completedSteps: 2
    },
    {
        name: "Carer",
        description: "Take care of your pets and nurture them",
        iconSrc: "/images/achievement/achievement-10-1.png",
        progress: 100,
        completedSteps: 10
    },
    {
        name: "Friends",
        description: "Build friendships and social connections",
        iconSrc: "/images/achievement/achievement-11-1.png",
        progress: 100,
        completedSteps: 3
    },
    {
        name: "Missions",
        description: "Complete various missions and challenges",
        iconSrc: "/images/achievement/achievement-12-1.png",
        progress: 100,
        completedSteps: 7
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