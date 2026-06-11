package jellyfin

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"

	"github.com/gofiber/fiber/v3"
)

type UserMeResponse struct {
	Id     string `json:"Id"`
	Name   string `json:"Name"`
	Policy struct {
		IsAdministrator bool `json:"IsAdministrator"`
	} `json:"Policy"`
}

func AuthenticateByToken(c fiber.Ctx) (bool, error) {
	jellyfinURLRaw := c.Query("jellyfin_url")
	if jellyfinURLRaw == "" {
		return false, errors.New("missing jellyfin_url query parameter")
	}

	baseURL, err := url.Parse(jellyfinURLRaw)
	if err != nil {
		return false, errors.New("invalid jellyfin_url")
	}

	endpoint, _ := url.Parse("/Users/Me")
	fullURL := baseURL.ResolveReference(endpoint)

	token := c.Get("Authorization")
	if token == "" {
		return false, errors.New("missing Authorization header")
	}

	req, err := http.NewRequest(http.MethodGet, fullURL.String(), nil)
	if err != nil {
		return false, err
	}

	req.Header.Set("ApiKey", token)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return false, err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK {
		if res.StatusCode == http.StatusUnauthorized {
			return false, errors.New("unauthorized: invalid Jellyfin token")
		}
		return false, errors.New("failed to authenticate with Jellyfin: " + res.Status)
	}

	var user UserMeResponse
	if err := json.NewDecoder(res.Body).Decode(&user); err != nil {
		return false, err
	}

	return user.Policy.IsAdministrator, nil
}
