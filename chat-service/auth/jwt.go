package auth

import (
	"errors"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	jwt.RegisteredClaims
}

// VerifyToken проверяет JWT и возвращает user_id из claim "sub".
func VerifyToken(tokenStr, secret, alg string) (*Claims, int64, error) {
	token, err := jwt.ParseWithClaims(
		tokenStr,
		&Claims{},
		func(t *jwt.Token) (interface{}, error) {
			if t.Method.Alg() != alg {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(secret), nil
		},
		jwt.WithExpirationRequired(),
		jwt.WithValidMethods([]string{alg}),
	)
	if err != nil {
		return nil, 0, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, 0, errors.New("invalid token")
	}
	uid, err := strconv.ParseInt(claims.Subject, 10, 64)
	if err != nil {
		return nil, 0, errors.New("invalid sub claim")
	}
	return claims, uid, nil
}

func ExtractBearer(header string) string {
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return parts[1]
}
