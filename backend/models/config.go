package models

type AppConfig struct {
	JsonSchema                  string              `json:"$schema,omitempty"`
	HomeScreenSections          []HomeScreenSection `json:"homeScreenSections,omitempty"`
	ItemPage                    *ItemPageSettings   `json:"itemPage,omitempty"`
	ServerAddress               string              `json:"serverAddress,omitempty"`
	LogoLightURL                string              `json:"logoLightUrl,omitempty"`
	LogoDarkURL                 string              `json:"logoDarkUrl,omitempty"`
	ShowStreamystatsButton      *bool               `json:"showStreamystatsButton,omitempty"`
	StreamystatsURL             string              `json:"streamystatsUrl,omitempty"`
	WatchedStateBadgeHomeScreen *bool               `json:"watchedStateBadgeHomeScreen,omitempty"`
	WatchedStateBadgeLibrary    *bool               `json:"watchedStateBadgeLibrary,omitempty"`
	WatchedStateBadgeGenre      *bool               `json:"watchedStateBadgeGenre,omitempty"`
	WatchedStateBadgeSearch     *bool               `json:"watchedStateBadgeSearch,omitempty"`
	ServerThemeId               string              `json:"serverThemeId,omitempty"`
	ServerName                  string              `json:"serverName,omitempty"`
	Links                       []ConfigLink        `json:"links,omitempty"`
}

type ConfigLink struct {
	URL  string `json:"url"`
	Text string `json:"text"`
	Icon string `json:"icon"`
}

type HomeScreenSection struct {
	Type string `json:"type"`

	// Common fields
	Title   string `json:"title,omitempty"`
	Enabled *bool  `json:"enabled,omitempty"`

	// MediaBar
	Items               *SectionItemsConfig `json:"items,omitempty"`
	ShowFavoriteButton  *bool               `json:"showFavoriteButton,omitempty"`
	ShowWatchlistButton *bool               `json:"showWatchlistButton,omitempty"`
	Size                string              `json:"size,omitempty"`

	// RecentlyAdded
	Limit      *int     `json:"limit,omitempty"`
	LibraryIDs []string `json:"libraryIds,omitempty"`

	// Items section
	AllLink      string        `json:"allLink,omitempty"`
	DetailFields []DetailField `json:"detailFields,omitempty"`

	// Continue / Resume / NextUp
	DetailLine []ContinueWatchingDetailLine `json:"detailLine,omitempty"`
	TitleLine  ContinueWatchingTitleLine    `json:"titleLine,omitempty"`

	// ContinueWatching specific
	AccurateSorting *bool `json:"accurateSorting,omitempty"`

	// Recommended
	RecommendationType RecommendationTypeFilter `json:"recommendationType,omitempty"`
	ShowBasedOn        *bool                    `json:"showBasedOn,omitempty"`
	ShowSimilarity     *bool                    `json:"showSimilarity,omitempty"`
}

type ItemPageSettings struct {
	DetailBadges        []DetailBadge  `json:"detailBadges,omitempty"`
	EpisodeDisplay      EpisodeDisplay `json:"episodeDisplay,omitempty"`
	ShowDownloadButton  *bool          `json:"showDownloadButton,omitempty"`
	FavoriteButton      []BaseItemKind `json:"favoriteButton"`
	ShowWatchlistButton *bool          `json:"showWatchlistButton,omitempty"`
	DeleteButton        []BaseItemKind `json:"deleteButton,omitempty"`
}

type SectionItemsConfig struct {
	Genres                   []string     `json:"genres,omitempty"`
	Tags                     []string     `json:"tags,omitempty"`
	Types                    []string     `json:"types,omitempty"`
	LibraryID                string       `json:"libraryId,omitempty"`
	Limit                    *int         `json:"limit,omitempty"`
	IsFavorite               *bool        `json:"isFavorite,omitempty"`
	IsUnplayed               *bool        `json:"isUnplayed,omitempty"`
	IsInKefinTweaksWatchlist *bool        `json:"isInKefinTweaksWatchlist,omitempty"`
	SortBy                   []ItemSortBy `json:"sortBy,omitempty"`
	SortOrder                string       `json:"sortOrder,omitempty"`
}

type BaseItemKind string

type ContinueWatchingDetailLine string
type ContinueWatchingTitleLine string

type DetailBadge string
type DetailField string

type EpisodeDisplay string

type ItemSortBy string

type RecommendationTypeFilter string

const (
	SectionMediaBar      = "mediaBar"
	SectionItems         = "items"
	SectionRecentlyAdded = "recentlyAdded"
	SectionContinue      = "continueWatching"
	SectionNextUp        = "nextUp"
	SectionResume        = "resume"
	SectionRecommended   = "streamystatsRecommended"
	SectionGenres        = "genres"
	SectionLibraries     = "libraries"
)
