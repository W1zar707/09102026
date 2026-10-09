import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  useCallback,
  useRef,
  type ReactNode,
  type Dispatch,
} from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Grid,
  Paper,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Card,
  CardMedia,
  CardContent,
  Skeleton,
  CircularProgress,
  Alert,
  Badge,
  Divider,
  Button,
  type SelectChangeEvent,
} from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

/* =========================================================
   1. ТИПЫ
   ========================================================= */

type DogGroup = 'Sporting' | 'Herding' | 'Working' | 'Toy' | 'Hound' | 'Non-Sporting';

interface DogBreed {
  name: string;
  min_height: number;
  max_height: number;
  min_weight: number;
  max_weight: number;
  min_life_expectancy: number;
  max_life_expectancy: number;
  grooming: number;
  shedding: number;
  playfulness: number;
  energy: number;
  trainability: number;
  good_with_children: number;
  group: DogGroup;
}

type SortField =
  | 'name'
  | 'min_height'
  | 'max_height'
  | 'max_weight'
  | 'grooming'
  | 'playfulness'
  | 'energy';

type SortDir = 'asc' | 'desc';

interface DogsState {
  breeds: DogBreed[];
  loading: boolean;
  error: string | null;
  search: string;
  sortBy: SortField;
  sortDir: SortDir;
  favorites: string[];
  groupFilter: DogGroup | 'all';
}

type DogsAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: DogBreed[] }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_GROUP'; payload: DogGroup | 'all' }
  | { type: 'SORT'; payload: { field: SortField; dir: SortDir } }
  | { type: 'TOGGLE_FAVORITE'; payload: string }
  | { type: 'RESET_FAVORITES' };

interface DogsContextValue {
  state: DogsState;
  dispatch: Dispatch<DogsAction>;
}

/* =========================================================
   2. API-СЛОЙ
   ========================================================= */

const PROXY_URL = 'https://dog-proxy.example.workers.dev';
const USE_PROXY = false;

const fetchRandomDogImage = async (): Promise<string> => {
  const res = await fetch('https://dog.ceo/api/breeds/image/random');
  const data: { message: string; status: string } = await res.json();
  return data.message;
};

const MOCK_BREEDS: DogBreed[] = [
  { name: 'Labrador Retriever', min_height: 55, max_height: 62, min_weight: 25, max_weight: 36, min_life_expectancy: 10, max_life_expectancy: 12, grooming: 4, shedding: 4, playfulness: 5, energy: 5, trainability: 5, good_with_children: 5, group: 'Sporting' },
  { name: 'German Shepherd', min_height: 55, max_height: 65, min_weight: 22, max_weight: 40, min_life_expectancy: 9, max_life_expectancy: 13, grooming: 4, shedding: 5, playfulness: 4, energy: 5, trainability: 5, good_with_children: 4, group: 'Herding' },
  { name: 'Golden Retriever', min_height: 51, max_height: 61, min_weight: 25, max_weight: 34, min_life_expectancy: 10, max_life_expectancy: 12, grooming: 4, shedding: 4, playfulness: 5, energy: 4, trainability: 5, good_with_children: 5, group: 'Sporting' },
  { name: 'Bulldog', min_height: 31, max_height: 40, min_weight: 18, max_weight: 25, min_life_expectancy: 8, max_life_expectancy: 10, grooming: 2, shedding: 3, playfulness: 3, energy: 2, trainability: 3, good_with_children: 5, group: 'Non-Sporting' },
  { name: 'Poodle', min_height: 23, max_height: 38, min_weight: 2, max_weight: 32, min_life_expectancy: 12, max_life_expectancy: 18, grooming: 5, shedding: 1, playfulness: 5, energy: 4, trainability: 5, good_with_children: 4, group: 'Non-Sporting' },
  { name: 'Beagle', min_height: 33, max_height: 41, min_weight: 9, max_weight: 16, min_life_expectancy: 12, max_life_expectancy: 15, grooming: 2, shedding: 3, playfulness: 5, energy: 5, trainability: 3, good_with_children: 5, group: 'Hound' },
  { name: 'Rottweiler', min_height: 56, max_height: 69, min_weight: 36, max_weight: 60, min_life_expectancy: 8, max_life_expectancy: 10, grooming: 2, shedding: 3, playfulness: 3, energy: 3, trainability: 4, good_with_children: 3, group: 'Working' },
  { name: 'Yorkshire Terrier', min_height: 18, max_height: 23, min_weight: 1.8, max_weight: 3.2, min_life_expectancy: 13, max_life_expectancy: 16, grooming: 5, shedding: 1, playfulness: 4, energy: 3, trainability: 3, good_with_children: 3, group: 'Toy' },
  { name: 'Dachshund', min_height: 13, max_height: 27, min_weight: 4, max_weight: 14, min_life_expectancy: 12, max_life_expectancy: 16, grooming: 2, shedding: 3, playfulness: 4, energy: 3, trainability: 3, good_with_children: 4, group: 'Hound' },
  { name: 'Siberian Husky', min_height: 50, max_height: 60, min_weight: 16, max_weight: 27, min_life_expectancy: 12, max_life_expectancy: 14, grooming: 5, shedding: 5, playfulness: 5, energy: 5, trainability: 3, good_with_children: 4, group: 'Working' },
  { name: 'Boxer', min_height: 53, max_height: 63, min_weight: 25, max_weight: 32, min_life_expectancy: 10, max_life_expectancy: 12, grooming: 2, shedding: 3, playfulness: 5, energy: 5, trainability: 4, good_with_children: 4, group: 'Working' },
  { name: 'Shih Tzu', min_height: 20, max_height: 28, min_weight: 4, max_weight: 7.5, min_life_expectancy: 10, max_life_expectancy: 16, grooming: 5, shedding: 2, playfulness: 3, energy: 2, trainability: 3, good_with_children: 4, group: 'Toy' },
  { name: 'Corgi', min_height: 25, max_height: 30, min_weight: 10, max_weight: 14, min_life_expectancy: 12, max_life_expectancy: 15, grooming: 4, shedding: 5, playfulness: 5, energy: 4, trainability: 4, good_with_children: 5, group: 'Herding' },
  { name: 'Doberman', min_height: 61, max_height: 72, min_weight: 32, max_weight: 45, min_life_expectancy: 10, max_life_expectancy: 12, grooming: 2, shedding: 3, playfulness: 3, energy: 4, trainability: 5, good_with_children: 3, group: 'Working' },
  { name: 'Pomeranian', min_height: 18, max_height: 24, min_weight: 1.9, max_weight: 3.5, min_life_expectancy: 12, max_life_expectancy: 16, grooming: 5, shedding: 4, playfulness: 4, energy: 3, trainability: 3, good_with_children: 3, group: 'Toy' },
];

const fetchDogBreeds = async (name = ''): Promise<DogBreed[]> => {
  if (USE_PROXY) {
    const target = `https://api.api-ninjas.com/v1/dogs?name=${encodeURIComponent(name)}`;
    const res = await fetch(`${PROXY_URL}?target=${encodeURIComponent(target)}`);
    if (!res.ok) throw new Error('Ошибка загрузки пород');
    return (await res.json()) as DogBreed[];
  }
  const q = name.trim().toLowerCase();
  await new Promise((r) => setTimeout(r, 300));
  return q ? MOCK_BREEDS.filter((b) => b.name.toLowerCase().includes(q)) : MOCK_BREEDS;
};

/* =========================================================
   3. REDUCER + CONTEXT
   ========================================================= */

const initialState: DogsState = {
  breeds: [],
  loading: false,
  error: null,
  search: '',
  sortBy: 'name',
  sortDir: 'asc',
  favorites: [],
  groupFilter: 'all',
};

const dogsReducer = (state: DogsState, action: DogsAction): DogsState => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, breeds: action.payload };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_GROUP':
      return { ...state, groupFilter: action.payload };
    case 'SORT':
      return { ...state, sortBy: action.payload.field, sortDir: action.payload.dir };
    case 'TOGGLE_FAVORITE': {
      const id = action.payload;
      const has = state.favorites.includes(id);
      return {
        ...state,
        favorites: has
          ? state.favorites.filter((x) => x !== id)
          : [...state.favorites, id],
      };
    }
    case 'RESET_FAVORITES':
      return { ...state, favorites: [] };
    default:
      return state;
  }
};

const DogsContext = createContext<DogsContextValue | null>(null);

const DogsProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(dogsReducer, initialState);
  const value = useMemo<DogsContextValue>(() => ({ state, dispatch }), [state]);
  return <DogsContext.Provider value={value}>{children}</DogsContext.Provider>;
};

const useDogsContext = (): DogsContextValue => {
  const ctx = useContext(DogsContext);
  if (!ctx) throw new Error('useDogsContext вне DogsProvider');
  return ctx;
};

/* =========================================================
   4. ХУКИ
   ========================================================= */

const useDebounce = <T,>(value: T, delay = 400): T => {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

/* =========================================================
   5. КОМПОНЕНТЫ
   ========================================================= */

const Header = () => {
  const { state, dispatch } = useDogsContext();
  return (
    <AppBar position="sticky" sx={{ mb: 3 }}>
      <Toolbar>
        <PetsIcon sx={{ mr: 2 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Инфографика: Породы собак
        </Typography>
        {state.favorites.length > 0 && (
          <Button
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={() => dispatch({ type: 'RESET_FAVORITES' })}
            sx={{ mr: 2 }}
          >
            Сбросить избранное
          </Button>
        )}
        <Badge badgeContent={state.favorites.length} color="error">
          <FavoriteIcon />
        </Badge>
      </Toolbar>
    </AppBar>
  );
};

interface FiltersProps {
  groups: DogGroup[];
}

const Filters: React.FC<FiltersProps> = ({ groups }) => {
  const { state, dispatch } = useDogsContext();

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={5}>
          <TextField
            fullWidth
            label="Поиск породы"
            value={state.search}
            onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Группа</InputLabel>
            <Select
              label="Группа"
              value={state.groupFilter}
              onChange={(e: SelectChangeEvent) =>
                dispatch({ type: 'SET_GROUP', payload: e.target.value as DogGroup | 'all' })
              }
            >
              <MenuItem value="all">Все группы</MenuItem>
              {groups.map((g) => (
                <MenuItem key={g} value={g}>
                  {g}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Сортировка</InputLabel>
            <Select
              label="Сортировка"
              value={`${state.sortBy}:${state.sortDir}`}
              onChange={(e: SelectChangeEvent) => {
                const [field, dir] = e.target.value.split(':') as [SortField, SortDir];
                dispatch({ type: 'SORT', payload: { field, dir } });
              }}
            >
              <MenuItem value="name:asc">Имя ↑</MenuItem>
              <MenuItem value="name:desc">Имя ↓</MenuItem>
              <MenuItem value="min_height:asc">Рост ↑</MenuItem>
              <MenuItem value="max_height:desc">Рост ↓</MenuItem>
              <MenuItem value="max_weight:desc">Вес ↓</MenuItem>
              <MenuItem value="grooming:desc">Линька ↓</MenuItem>
              <MenuItem value="playfulness:desc">Игривость ↓</MenuItem>
              <MenuItem value="energy:desc">Энергия ↓</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

interface DogCardProps {
  breed: string;
}

const DogCard: React.FC<DogCardProps> = ({ breed }) => {
  const [img, setImg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const mountedRef = useRef<boolean>(true);

  const loadImage = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const url = await fetchRandomDogImage();
      if (mountedRef.current) setImg(url);
    } catch {
      /* ignore */
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void loadImage();
    return () => {
      mountedRef.current = false;
    };
  }, [loadImage]);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {loading || !img ? (
        <Skeleton variant="rectangular" height={200} />
      ) : (
        <CardMedia
          component="img"
          height="200"
          image={img}
          alt={breed}
          sx={{ objectFit: 'cover' }}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {breed}
        </Typography>
        <Button size="small" startIcon={<RefreshIcon />} onClick={() => void loadImage()}>
          Другая картинка
        </Button>
      </CardContent>
    </Card>
  );
};

const Loader: React.FC = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
    <CircularProgress />
  </Box>
);

interface BarDatum {
  name: string;
  weight: string;
  lifespan: string;
}

interface RadarDatum {
  breed: string;
  Линька: number;
  Игривость: number;
  Энергия: number;
  Дрессировка: number;
  'С детьми': number;
}

interface PieDatum {
  name: string;
  value: number;
}

interface ChartsProps {
  data: DogBreed[];
}

const Charts: React.FC<ChartsProps> = ({ data }) => {
  const barData = useMemo<BarDatum[]>(
    () =>
      data.slice(0, 8).map((d) => ({
        name: d.name.split(' ')[0],
        weight: ((d.min_weight + d.max_weight) / 2).toFixed(1),
        lifespan: ((d.min_life_expectancy + d.max_life_expectancy) / 2).toFixed(1),
      })),
    [data]
  );

  const radarData = useMemo<RadarDatum[]>(
    () =>
      data.slice(0, 3).map((d) => ({
        breed: d.name.split(' ')[0],
        Линька: d.shedding,
        Игривость: d.playfulness,
        Энергия: d.energy,
        Дрессировка: d.trainability,
        'С детьми': d.good_with_children,
      })),
    [data]
  );

  const pieData = useMemo<PieDatum[]>(() => {
    const map = new Map<DogGroup, number>();
    data.forEach((d) => {
      map.set(d.group, (map.get(d.group) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [data]);

  const COLORS = ['#1976d2', '#9c27b0', '#2e7d32', '#ed6c02', '#d32f2f', '#0288d1'];

  if (!data.length) return null;

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} md={7}>
        <Paper sx={{ p: 2, height: 360 }}>
          <Typography variant="h6" gutterBottom>
            Вес и продолжительность жизни
          </Typography>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="weight" fill="#1976d2" name="Вес (кг)" />
              <Bar dataKey="lifespan" fill="#9c27b0" name="Жизнь (лет)" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={5}>
        <Paper sx={{ p: 2, height: 360 }}>
          <Typography variant="h6" gutterBottom>
            Топ-3 по характеристикам
          </Typography>
          <ResponsiveContainer width="100%" height="88%">
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid />
              <PolarAngleAxis dataKey="breed" />
              <PolarRadiusAxis domain={[0, 5]} />
              <Radar name="Игривость" dataKey="Игривость" stroke="#2e7d32" fill="#4caf50" fillOpacity={0.4} />
              <Radar name="Линька" dataKey="Линька" stroke="#d32f2f" fill="#ef5350" fillOpacity={0.4} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={5}>
        <Paper sx={{ p: 2, height: 320 }}>
          <Typography variant="h6" gutterBottom>
            Распределение по группам
          </Typography>
          <ResponsiveContainer width="100%" height="88%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      <Grid item xs={12} md={7}>
        <Paper sx={{ p: 2, height: 320 }}>
          <Typography variant="h6" gutterBottom>
            Игривость vs Энергия
          </Typography>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart
              data={data.slice(0, 10).map((d) => ({
                name: d.name.split(' ')[0],
                playfulness: d.playfulness,
                energy: d.energy,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="playfulness" fill="#ed6c02" name="Игривость" />
              <Bar dataKey="energy" fill="#0288d1" name="Энергия" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );
};

interface DogsTableProps {
  data: DogBreed[];
}

const DogsTable: React.FC<DogsTableProps> = ({ data }) => {
  const { state, dispatch } = useDogsContext();
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell />
            <TableCell><b>Порода</b></TableCell>
            <TableCell><b>Группа</b></TableCell>
            <TableCell align="right"><b>Рост (см)</b></TableCell>
            <TableCell align="right"><b>Вес (кг)</b></TableCell>
            <TableCell align="right"><b>Жизнь (лет)</b></TableCell>
            <TableCell align="center"><b>Линька</b></TableCell>
            <TableCell align="center"><b>Игривость</b></TableCell>
            <TableCell align="center"><b>Энергия</b></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((d) => {
            const fav = state.favorites.includes(d.name);
            return (
              <TableRow key={d.name} hover>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => dispatch({ type: 'TOGGLE_FAVORITE', payload: d.name })}
                  >
                    {fav ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
                  </IconButton>
                </TableCell>
                <TableCell>{d.name}</TableCell>
                <TableCell>
                  <Chip size="small" label={d.group} variant="outlined" />
                </TableCell>
                <TableCell align="right">{d.min_height}–{d.max_height}</TableCell>
                <TableCell align="right">{d.min_weight}–{d.max_weight}</TableCell>
                <TableCell align="right">
                  {d.min_life_expectancy}–{d.max_life_expectancy}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    size="small"
                    label={d.shedding}
                    color={d.shedding >= 4 ? 'error' : 'default'}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip size="small" label={d.playfulness} color="success" />
                </TableCell>
                <TableCell align="center">
                  <Chip size="small" label={d.energy} color="warning" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

interface StatsBarProps {
  total: number;
  filtered: number;
  favorites: number;
  loading: boolean;
}

const StatsBar: React.FC<StatsBarProps> = ({ total, filtered, favorites, loading }) => (
  <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
    <Typography variant="body1">
      Всего пород: <b>{total}</b>
    </Typography>
    <Divider orientation="vertical" flexItem />
    <Typography variant="body1">
      Показано: <b>{filtered}</b>
    </Typography>
    <Divider orientation="vertical" flexItem />
    <Typography variant="body1">
      В избранном: <b>{favorites}</b>
    </Typography>
    <Divider orientation="vertical" flexItem />
    <Typography variant="body1" color="text.secondary">
      {loading ? 'Загрузка…' : 'Данные актуальны'}
    </Typography>
  </Paper>
);

/* =========================================================
   6. ГЛАВНЫЙ КОМПОНЕНТ
   ========================================================= */

const DogsDashboard: React.FC = () => {
  const { state, dispatch } = useDogsContext();
  const debouncedSearch = useDebounce<string>(state.search, 400);

  useEffect(() => {
    let alive = true;
    const load = async (): Promise<void> => {
      dispatch({ type: 'FETCH_START' });
      try {
        const data = await fetchDogBreeds(debouncedSearch);
        if (alive) dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (e) {
        if (alive) dispatch({ type: 'FETCH_ERROR', payload: (e as Error).message });
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [debouncedSearch, dispatch]);

  const groups = useMemo<DogGroup[]>(
    () => Array.from(new Set(state.breeds.map((b) => b.group))).sort(),
    [state.breeds]
  );

  const visible = useMemo<DogBreed[]>(() => {
    let list = [...state.breeds];

    if (state.groupFilter !== 'all') {
      list = list.filter((d) => d.group === state.groupFilter);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      const av = a[state.sortBy];
      const bv = b[state.sortBy];
      if (typeof av === 'string' && typeof bv === 'string') {
        return state.sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = av as number;
      const bn = bv as number;
      return state.sortDir === 'asc' ? an - bn : bn - an;
    });

    return list;
  }, [state.breeds, state.groupFilter, state.sortBy, state.sortDir, debouncedSearch]);

  const topThree = useMemo<DogBreed[]>(
    () => [...state.breeds].sort((a, b) => b.playfulness - a.playfulness).slice(0, 3),
    [state.breeds]
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Header />

      <Typography variant="h4" gutterBottom>
        🐶 Панель пород собак
      </Typography>

      <StatsBar
        total={state.breeds.length}
        filtered={visible.length}
        favorites={state.favorites.length}
        loading={state.loading}
      />

      <Filters groups={groups} />

      {state.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {state.error}
        </Alert>
      )}

      {state.loading ? (
        <Loader />
      ) : (
        <>
          <Typography variant="h5" sx={{ mb: 1 }}>
            🖼️ Самые игривые породы
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {topThree.map((d) => (
              <Grid item xs={12} sm={6} md={4} key={d.name}>
                <DogCard breed={d.name} />
              </Grid>
            ))}
          </Grid>

          <Typography variant="h5" sx={{ mb: 1 }}>
            📊 Графики
          </Typography>
          <Charts data={visible} />

          <Typography variant="h5" sx={{ mb: 1 }}>
            📋 Таблица пород
          </Typography>
          {visible.length === 0 ? (
            <Alert severity="info">Нет данных по заданным фильтрам</Alert>
          ) : (
            <DogsTable data={visible} />
          )}
        </>
      )}

      <Box sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="caption">
          © Инфографика собак · Самостоятельная работа по React + TypeScript
        </Typography>
      </Box>
    </Container>
  );
};

/* =========================================================
   7. APP
   ========================================================= */

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
    background: { default: '#f5f7fb' },
  },
  shape: { borderRadius: 12 },
});

export default function App(): JSX.Element {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DogsProvider>
        <DogsDashboard />
      </DogsProvider>
    </ThemeProvider>
  );
}