package models

type StudioSummary struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Count    int    `json:"count"`
	HasThumb bool   `json:"hasThumb,omitempty"`
}

type StudiosPage struct {
	Items      []StudioSummary `json:"items"`
	TotalCount int             `json:"totalCount"`
}
