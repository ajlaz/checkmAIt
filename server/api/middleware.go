package api

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

// CORSMiddleware handles Cross-Origin Resource Sharing
func CORSMiddleware(corsOrigins, corsMethods, corsHeaders string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the origin from the request header
		requestOrigin := c.Request.Header.Get("Origin")

		// Use the configured origins to check if the request origin is allowed
		allowedOrigins := strings.Split(corsOrigins, ",")
		allowOrigin := ""

		// Check if the request origin is in the allowed origins list
		if requestOrigin != "" {
			for _, allowedOrigin := range allowedOrigins {
				trimmedOrigin := strings.TrimSpace(allowedOrigin)
				// Support wildcard or exact match
				if trimmedOrigin == "*" || trimmedOrigin == requestOrigin {
					allowOrigin = requestOrigin
					break
				}
			}
		}

		// If no origin matched, use the first allowed origin as fallback
		// This handles cases where Origin header might not be sent
		if allowOrigin == "" && len(allowedOrigins) > 0 {
			firstOrigin := strings.TrimSpace(allowedOrigins[0])
			if firstOrigin == "*" {
				allowOrigin = "*"
			} else {
				allowOrigin = firstOrigin
			}
		}

		// Use the configured methods and headers
		allowMethods := corsMethods
		if allowMethods == "" {
			allowMethods = "GET,POST,PUT,PATCH,DELETE,OPTIONS"
		}

		allowHeaders := corsHeaders
		if allowHeaders == "" {
			allowHeaders = "Content-Type,Content-Length,Accept-Encoding,X-CSRF-Token,Authorization,accept,origin,Cache-Control,X-Requested-With"
		}

		// Set the CORS headers
		c.Writer.Header().Set("Access-Control-Allow-Origin", allowOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", allowHeaders)
		c.Writer.Header().Set("Access-Control-Allow-Methods", allowMethods)

		// Handle OPTIONS requests immediately
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// JWTAuthMiddleware validates JWT tokens and sets user claims in context
func JWTAuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		// Check if the Authorization header has the right format
		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			c.Abort()
			return
		}

		// Extract the token
		tokenString := parts[1]

		// Parse and validate the token
		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			// Validate the alg is what we expect
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		if !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Set the user claims in the context
		c.Set("userID", claims["user_id"])
		c.Set("username", claims["username"])
		c.Set("email", claims["email"])

		c.Next()
	}
}
