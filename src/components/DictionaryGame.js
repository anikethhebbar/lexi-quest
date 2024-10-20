import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box,
    Button,
    Input,
    Radio,
    RadioGroup,
    Stack,
    Text,
    Alert,
    AlertIcon,
    AlertDescription,
    Badge,
    Heading,
    VStack,
    HStack,
    extendTheme,
    ChakraProvider,
    useColorMode,
    useColorModeValue,
    Flex,
    Container,
    Tooltip,
} from '@chakra-ui/react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import BTree from '../utils/BTree';
import categories from '../data/categories';
import wordDefinitions from '../data/wordDefinitions';

const theme = extendTheme({
    components: {
        Button: {
            baseStyle: {
                borderRadius: 'md',
                _hover: {
                    transform: 'scale(1.05)',
                },
            },
            variants: {
                solid: {
                    bg: 'blue.500',
                    color: 'white',
                    _hover: {
                        bg: 'blue.600',
                    },
                },
                outline: {
                    borderColor: 'blue.500',
                    color: 'blue.500',
                    _hover: {
                        bg: 'blue.50',
                    },
                },
            },
        },
    },
});

const DictionaryGame = () => {
    const [tree, setTree] = useState(() => new BTree(2));
    const [word, setWord] = useState('');
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [gameOver, setGameOver] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [hints, setHints] = useState(3); // Default hints for medium difficulty
    const [difficulty, setDifficulty] = useState('medium');
    const [selectedCategory, setSelectedCategory] = useState('fruits');
    const [message, setMessage] = useState('');
    const [userWords, setUserWords] = useState([]);
    const [leaderboard, setLeaderboard] = useState(() =>
        JSON.parse(localStorage.getItem('leaderboard')) || []
    );
    const [achievements, setAchievements] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [currentDefinition, setCurrentDefinition] = useState('');
    const [currentWord, setCurrentWord] = useState('');
    const [isPaused, setIsPaused] = useState(false);
    const [usedWords, setUsedWords] = useState([]);

    const { colorMode, toggleColorMode } = useColorMode();
    const bgColor = useColorModeValue('gray.100', 'gray.900');
    const textColor = useColorModeValue('black', 'white');
    const gradientText = useColorModeValue(
        'linear(to-r, blue.500, blue.700)',
        'linear(to-r, pink.300, purple.500, pink.300)'
    );

    const difficultyMultipliers = useMemo(() => ({
        easy: 1,
        medium: 1.5,
        hard: 2,
    }), []);

    const initializeTree = useCallback(() => {
        const newTree = new BTree(2);
        const selectedWords = categories[selectedCategory] || [];
        selectedWords.concat(userWords).forEach((word) => {
            newTree.insert(word.toLowerCase());
        });
        setTree(newTree);
    }, [selectedCategory, userWords]);

    useEffect(() => {
        initializeTree();
    }, [initializeTree]);

    useEffect(() => {
        let timerId;
        if (timeLeft > 0 && gameStarted && !gameOver && !isPaused) {
            timerId = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);
        } else if (timeLeft === 0 && gameStarted) {
            setGameOver(true);
        }
        return () => clearInterval(timerId);
    }, [timeLeft, gameStarted, gameOver, isPaused]);

    const getRandomWordAndDefinition = useCallback(() => {
        const categoryWords = categories[selectedCategory].filter(
            (word) => !usedWords.includes(word)
        );
        if (categoryWords.length === 0) {
            setGameOver(true);
            setMessage('No more words available in this category.');
            return { word: '', definition: '' };
        }
        const randomWord =
            categoryWords[Math.floor(Math.random() * categoryWords.length)];
        const definition = wordDefinitions[randomWord];
        setUsedWords((prev) => [...prev, randomWord]);
        return {
            word: randomWord,
            definition: definition || 'Definition not available.',
        };
    }, [selectedCategory, usedWords]);

    const startGame = () => {
        if (playerName) {
            setGameStarted(true);
            setGameOver(false);
            setScore(0);
            setTimeLeft(60);
            // Set hints based on difficulty
            setHints(difficulty === 'easy' ? 7 : difficulty === 'medium' ? 5 : 3);
            setMessage('');
            setUsedWords([]);
            initializeTree();
            const { word, definition } = getRandomWordAndDefinition();
            setCurrentWord(word);
            setCurrentDefinition(definition);
        } else {
            setMessage('Please enter your name to start the game.');
        }
    };
    

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!gameStarted || gameOver) return;

        if (word.toLowerCase() === currentWord.toLowerCase()) {
            const timeBonus = Math.max(0, 10 - (60 - timeLeft));
            const multiplier = difficultyMultipliers[difficulty];
            const points = Math.round((1 + timeBonus) * multiplier);
            setScore((prevScore) => prevScore + points);

            setMessage(
                `Correct! "${word}" is the word. You earned ${points} points!`
            );
        } else {
            setMessage(`Sorry, "${word}" is not the correct word.`);
        }
        setWord('');
        checkAchievements();

        const { word: newWord, definition: newDefinition } =
            getRandomWordAndDefinition();
        setCurrentWord(newWord);
        setCurrentDefinition(newDefinition);
    };

    const handleHint = () => {
        if (hints > 0 && gameStarted && !gameOver) {
            setHints((prevHints) => prevHints - 1);
            const hintOptions = [
                `Hint: The word starts with "${currentWord.charAt(0)}".`,
                `Hint: The word has ${currentWord.length} letters.`,
                `Hint: The word contains the letter "${currentWord.charAt(Math.floor(Math.random() * currentWord.length))}".`,
                `Hint: The word is a type of "${wordDefinitions[currentWord] ? wordDefinitions[currentWord].split(' ')[0] : 'unknown'}".`
            ];
            const randomHint = hintOptions[Math.floor(Math.random() * hintOptions.length)];
            setMessage(randomHint);
        }
    };

    const addUserWord = () => {
        const newWord = prompt('Enter a new word:');
        if (newWord && !userWords.includes(newWord.toLowerCase())) {
            setUserWords((prevWords) => [...prevWords, newWord.toLowerCase()]);
            tree.insert(newWord.toLowerCase());
            const definition = prompt(
                `Enter the definition for "${newWord}":`
            );
            if (definition) {
                wordDefinitions[newWord.toLowerCase()] = definition;
            }
            setMessage(`Added "${newWord}" to the dictionary.`);
        }
    };

    const saveScore = () => {
        const newEntry = { name: playerName, score, difficulty };
        const updatedLeaderboard = [...leaderboard, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        setLeaderboard(updatedLeaderboard);
        localStorage.setItem('leaderboard', JSON.stringify(updatedLeaderboard));
        setShowLeaderboard(true);
    };

    const checkAchievements = () => {
        const newAchievements = [...achievements];
        if (score >= 50 && !achievements.includes('Word Master')) {
            newAchievements.push('Word Master');
        }
        if (hints === 0 && !achievements.includes('No Help Needed')) {
            newAchievements.push('No Help Needed');
        }
        if (newAchievements.length > achievements.length) {
            setAchievements(newAchievements);
            setMessage(
                (prevMessage) =>
                    `${prevMessage ? prevMessage + ' ' : ''}New achievement unlocked!`
            );
        }
    };

    const togglePause = () => {
        setIsPaused((prevPaused) => !prevPaused);
    };

    return (
        <ChakraProvider theme={theme}>
            <Flex
                direction="column"
                minH="100vh"
                bg={bgColor}
                color={textColor}
                px={4}
                py={8}
                alignItems="center"
            >
                <Container maxW="4xl">
                    <Box
                        className="dictionary-game"
                        w="100%"
                        p="6"
                        borderWidth="1px"
                        borderRadius="lg"
                        boxShadow="lg"
                        textAlign="center"
                    >
                        <Heading
                            as="h1"
                            size="xl"
                            mb="4"
                            bgGradient={gradientText}
                            bgClip="text"
                            fontSize={{ base: '2xl', md: '3xl', lg: '4xl' }}
                            fontWeight="extrabold"
                            letterSpacing="tight"
                        >
                            Lexi-Quest: A Word Adventure Powered by B-Trees
                        </Heading>

                        {!gameStarted ? (
                            <VStack spacing={4} alignItems="center">
                                <Input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    placeholder="Enter your name"
                                    size="md"
                                />
                                <RadioGroup
                                    onChange={setDifficulty}
                                    value={difficulty}
                                >
                                    <Stack direction="row" spacing={4}>
                                        <Radio value="easy">Easy</Radio>
                                        <Radio value="medium">Medium</Radio>
                                        <Radio value="hard">Hard</Radio>
                                    </Stack>
                                </RadioGroup>
                                <RadioGroup
                                    onChange={setSelectedCategory}
                                    value={selectedCategory}
                                >
                                    <Stack direction="row" spacing={4} flexWrap="wrap" justifyContent="center">
                                        {Object.keys(categories).map(
                                            (category) => (
                                                <Radio
                                                    key={category}
                                                    value={category}
                                                >
                                                    {category.charAt(0).toUpperCase() +
                                                        category.slice(1)}
                                                </Radio>
                                            )
                                        )}
                                    </Stack>
                                </RadioGroup>
                                <Button
                                    onClick={startGame}
                                    size="md"
                                    variant="solid"
                                >
                                    Start Game
                                </Button>

                                {message && (
                                    <Alert status="info" mt={4}>
                                        <AlertIcon />
                                        <AlertDescription>{message}</AlertDescription>
                                    </Alert>
                                )}
                            </VStack>
                        ) : (
                            <VStack spacing={4} alignItems="center">
                                <HStack spacing={4}>
                                    <Tooltip label="Your current score">
                                        <Text fontSize="md">
                                            Score:{' '}
                                            <Badge colorScheme="green">{score}</Badge>
                                        </Text>
                                    </Tooltip>
                                    <Tooltip label="Time remaining">
                                        <Text fontSize="md">
                                            Time Left:{' '}
                                            <Badge colorScheme="yellow">
                                                {timeLeft}s
                                            </Badge>
                                        </Text>
                                    </Tooltip>
                                    <Tooltip label="Available hints">
                                        <Text fontSize="md">
                                            Hints:{' '}
                                            <Badge colorScheme="blue">{hints}</Badge>
                                        </Text>
                                    </Tooltip>
                                </HStack>

                                <Text fontSize="md" mt="4">
                                    {currentDefinition}
                                </Text>

                                <form onSubmit={handleSubmit}>
                                    <HStack spacing={4}>
                                        <Input
                                            type="text"
                                            value={word}
                                            onChange={(e) => setWord(e.target.value)}
                                            placeholder="Enter a word"
                                            disabled={gameOver}
                                            size="md"
                                        />
                                        <Button
                                            type="submit"
                                            size="md"
                                            disabled={gameOver}
                                            variant="solid"
                                        >
                                            Submit
                                        </Button>
                                    </HStack>
                                </form>

                                <HStack spacing={4}>
                                    <Tooltip label="Get a hint about the word">
                                        <Button
                                            onClick={handleHint}
                                            disabled={hints === 0 || gameOver}
                                            size="sm"
                                            variant="outline"
                                        >
                                            Get Hint
                                        </Button>
                                    </Tooltip>
                                    <Tooltip label="Add a custom word to the game">
                                        <Button
                                            onClick={addUserWord}
                                            disabled={gameOver}
                                            size="sm"
                                            variant="outline"
                                        >
                                            Add Word
                                        </Button>
                                    </Tooltip>
                                    <Tooltip label="Pause or resume the game">
                                        <Button
                                            onClick={togglePause}
                                            size="sm"
                                            variant="outline"
                                        >
                                            {isPaused ? 'Resume' : 'Pause'}
                                        </Button>
                                    </Tooltip>
                                </HStack>

                                {message && (
                                    <Alert
                                        status={
                                            message.startsWith('Correct!')
                                                ? 'success'
                                                : 'error'
                                        }
                                        mt={4}
                                    >
                                        <AlertIcon />
                                        <AlertDescription>{message}</AlertDescription>
                                    </Alert>
                                )}

                                {gameOver && (
                                    <VStack spacing={2} alignItems="center" mt={4}>
                                        <Heading as="h2" size="md">
                                            Game Over
                                        </Heading>
                                        <Text fontSize="md">
                                            Final Score: {score}
                                        </Text>
                                        <Button
                                            onClick={saveScore}
                                            size="md"
                                            variant="solid"
                                        >
                                            Save Score
                                        </Button>
                                    </VStack>
                                )}

                                {showLeaderboard && (
                                    <Box mt="4" w="100%">
                                        <Heading as="h3" size="md" mb="2">
                                            Leaderboard
                                        </Heading>
                                        <ResponsiveContainer
                                            width="100%"
                                            height={300}
                                        >
                                            <BarChart data={leaderboard}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <RechartsTooltip />
                                                <Legend />
                                                <Bar dataKey="score" fill="#8884d8" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                )}
                            </VStack>
                        )}

                        <Heading as="h2" size="md" mt="8" mb="2">
                            Achievements
                        </Heading>
                        {achievements.length > 0 ? (
                            <HStack spacing={2} flexWrap="wrap" justifyContent="center">
                                {achievements.map((achievement) => (
                                    <Badge
                                        key={achievement}
                                        colorScheme="teal"
                                        mr="2"
                                    >
                                        {achievement}
                                    </Badge>
                                ))}
                            </HStack>
                        ) : (
                            <Text>No achievements unlocked yet.</Text>
                        )}
                    </Box>
                </Container>
                <Button size="sm" onClick={toggleColorMode} mt={10}>
                    Toggle {colorMode === 'light' ? 'Dark' : 'Light'} Mode
                </Button>
            </Flex>
        </ChakraProvider>
    );
};

export default DictionaryGame;