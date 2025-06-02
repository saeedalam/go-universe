# **Chapter 27: Platform Engineering with Go**

## **27.1 Introduction to Platform Engineering**

Platform Engineering represents a paradigm shift in how organizations deliver developer experiences and manage infrastructure. At its core, platform engineering is about creating internal developer platforms (IDPs) that abstract away infrastructure complexity, provide self-service capabilities, and increase developer productivity through standardized tooling and workflows.

Go has emerged as the language of choice for platform engineering due to its:

1. **Efficiency and Performance**: Go produces lightweight, statically-compiled binaries that start quickly and use resources efficiently
2. **Strong Standard Library**: Built-in support for HTTP servers, concurrency, and system operations
3. **Ecosystem Alignment**: The cloud-native ecosystem (Kubernetes, Docker, Terraform) is largely written in Go
4. **Cross-Platform Support**: Single codebase for tools that run across multiple operating systems
5. **Approachable Learning Curve**: Allows platform teams to onboard new engineers quickly

In this chapter, we'll explore how to build platform engineering solutions using Go, focusing on real-world patterns and practices that enable you to create robust, scalable internal developer platforms.

### **27.1.1 The Rise of Platform Engineering**

Platform engineering has grown in response to several challenges:

- Increasing complexity of cloud-native infrastructure
- The need for standardization across development teams
- Security and compliance requirements in regulated industries
- Pressure to accelerate development cycles and time-to-market

Rather than having each development team solve these problems independently, platform engineering teams build shared infrastructure and tooling that embody best practices and organizational standards.

### **27.1.2 Core Components of Developer Platforms**

A comprehensive internal developer platform typically consists of:

1. **Self-Service Portal**: A central interface where developers can provision resources
2. **Service Catalog**: Curated templates for common resources and applications
3. **Infrastructure Automation**: Tools for provisioning and managing infrastructure
4. **CI/CD Pipelines**: Standardized deployment pipelines
5. **Observability Stack**: Monitoring, logging, and tracing infrastructure
6. **Development Environment Management**: Tooling for consistent local development
7. **Security and Compliance Controls**: Automated enforcement of security policies

Throughout this chapter, we'll build components for each of these areas using Go, demonstrating how to create a cohesive platform experience.

### **27.1.3 The Golden Path Approach**

Platform engineering is often associated with the concept of "golden paths" - opinionated, well-documented, and supported paths that make it easy for developers to do the right thing by default. These paths:

- Reduce cognitive load on developers
- Enforce organizational best practices
- Accelerate onboarding of new team members
- Ensure consistency across different applications

We'll explore how to implement golden paths in Go-based platform tools, making the default path both the easiest and the most secure option.

## **27.2 Building a Self-Service Developer Portal**

A self-service developer portal is the central interface of your platform, allowing developers to discover, provision, and manage resources. Building one in Go gives you fine-grained control over performance, security, and integration capabilities.

### **27.2.1 Architecture of a Developer Portal**

A well-designed developer portal typically follows a layered architecture:

1. **Frontend Layer**: Web UI or CLI interface that developers interact with
2. **API Layer**: RESTful or GraphQL API that processes requests
3. **Service Layer**: Business logic handling platform operations
4. **Resource Layer**: Integration with underlying infrastructure providers

Let's design a flexible, modular architecture using Go:

```go
// portal/main.go
package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gorilla/mux"
	"github.com/yourorg/devportal/api"
	"github.com/yourorg/devportal/auth"
	"github.com/yourorg/devportal/config"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Initialize router
	router := mux.NewRouter()

	// Set up middleware
	router.Use(auth.JWTMiddleware)
	router.Use(api.LoggingMiddleware)
	router.Use(api.RecoveryMiddleware)

	// Register API routes
	api.RegisterRoutes(router, cfg)

	// Configure server
	srv := &http.Server{
		Handler:      router,
		Addr:         cfg.Server.ListenAddress,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server
	log.Printf("Starting developer portal on %s", cfg.Server.ListenAddress)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
```

This structure provides a clean separation of concerns and allows for modular development of portal features.

### **27.2.2 Implementing Core API Endpoints**

Let's implement key API endpoints that any developer portal should provide:

```go
// api/routes.go
package api

import (
	"github.com/gorilla/mux"
	"github.com/yourorg/devportal/config"
	"github.com/yourorg/devportal/handlers"
)

func RegisterRoutes(router *mux.Router, cfg *config.Config) {
	// API versioning
	v1 := router.PathPrefix("/api/v1").Subrouter()

	// Service catalog endpoints
	catalog := v1.PathPrefix("/catalog").Subrouter()
	catalog.HandleFunc("/services", handlers.ListServices).Methods("GET")
	catalog.HandleFunc("/services/{id}", handlers.GetService).Methods("GET")
	catalog.HandleFunc("/services/{id}/provision", handlers.ProvisionService).Methods("POST")

	// Environment management
	envs := v1.PathPrefix("/environments").Subrouter()
	envs.HandleFunc("", handlers.ListEnvironments).Methods("GET")
	envs.HandleFunc("/{id}", handlers.GetEnvironment).Methods("GET")
	envs.HandleFunc("/{id}/resources", handlers.ListEnvironmentResources).Methods("GET")

	// Resource management
	resources := v1.PathPrefix("/resources").Subrouter()
	resources.HandleFunc("", handlers.ListResources).Methods("GET")
	resources.HandleFunc("/{id}", handlers.GetResource).Methods("GET")
	resources.HandleFunc("/{id}", handlers.UpdateResource).Methods("PUT")
	resources.HandleFunc("/{id}", handlers.DeleteResource).Methods("DELETE")

	// User management
	users := v1.PathPrefix("/users").Subrouter()
	users.HandleFunc("/me", handlers.GetCurrentUser).Methods("GET")
	users.HandleFunc("/me/permissions", handlers.GetUserPermissions).Methods("GET")

	// Documentation endpoints
	v1.HandleFunc("/docs", handlers.GetDocumentation).Methods("GET")

	// Health check
	router.HandleFunc("/health", handlers.HealthCheck).Methods("GET")
}
```

### **27.2.3 Handling Resource Provisioning**

The most critical function of a developer portal is resource provisioning. Let's implement a flexible provisioning system:

```go
// handlers/provision.go
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"github.com/yourorg/devportal/models"
	"github.com/yourorg/devportal/provisioners"
)

// ProvisionService handles requests to provision a new service instance
func ProvisionService(w http.ResponseWriter, r *http.Request) {
	// Extract service ID from path
	vars := mux.Vars(r)
	serviceID := vars["id"]

	// Parse request body
	var req models.ProvisionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request: %v", err), http.StatusBadRequest)
		return
	}

	// Validate request
	if err := req.Validate(); err != nil {
		http.Error(w, fmt.Sprintf("Validation error: %v", err), http.StatusBadRequest)
		return
	}

	// Get user from context
	user := r.Context().Value("user").(models.User)

	// Create provisioning job
	job := models.ProvisioningJob{
		ID:        uuid.New().String(),
		ServiceID: serviceID,
		Request:   req,
		Status:    models.StatusPending,
		CreatedBy: user.ID,
		CreatedAt: time.Now(),
	}

	// Store job in database
	if err := job.Save(); err != nil {
		http.Error(w, "Failed to create provisioning job", http.StatusInternalServerError)
		return
	}

	// Start async provisioning
	go func() {
		// Get provisioner for service type
		provisioner, err := provisioners.GetProvisioner(serviceID)
		if err != nil {
			job.Status = models.StatusFailed
			job.Error = err.Error()
			job.Save()
			return
		}

		// Execute provisioning
		result, err := provisioner.Provision(req)
		if err != nil {
			job.Status = models.StatusFailed
			job.Error = err.Error()
			job.Save()
			return
		}

		// Update job with success
		job.Status = models.StatusCompleted
		job.ResourceID = result.ResourceID
		job.Outputs = result.Outputs
		job.CompletedAt = time.Now()
		job.Save()
	}()

	// Return job details to client
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{
		"job_id": job.ID,
		"status": string(job.Status),
	})
}
```

This implementation follows several best practices:

1. **Asynchronous Processing**: Long-running operations happen in the background
2. **Validation**: Requests are validated before processing
3. **Job Tracking**: Provisioning is tracked with a job ID for status updates
4. **Pluggable Provisioners**: Different service types can have different provisioning logic

### **27.2.4 Building a Flexible Provisioner System**

To make our portal extensible, let's implement a pluggable provisioner system:

```go
// provisioners/provisioner.go
package provisioners

import (
	"fmt"

	"github.com/yourorg/devportal/models"
)

// Provisioner defines the interface for service provisioning
type Provisioner interface {
	Provision(req models.ProvisionRequest) (*models.ProvisionResult, error)
	Update(resourceID string, req models.UpdateRequest) (*models.ProvisionResult, error)
	Delete(resourceID string) error
	GetStatus(resourceID string) (models.ResourceStatus, error)
}

// Registry of available provisioners
var provisioners = map[string]Provisioner{}

// RegisterProvisioner adds a provisioner to the registry
func RegisterProvisioner(serviceType string, provisioner Provisioner) {
	provisioners[serviceType] = provisioner
}

// GetProvisioner returns the appropriate provisioner for a service
func GetProvisioner(serviceID string) (Provisioner, error) {
	// Look up service to get its type
	service, err := models.GetServiceByID(serviceID)
	if err != nil {
		return nil, fmt.Errorf("service not found: %v", err)
	}

	// Find provisioner for this service type
	provisioner, exists := provisioners[service.Type]
	if !exists {
		return nil, fmt.Errorf("no provisioner registered for service type: %s", service.Type)
	}

	return provisioner, nil
}
```

Now we can implement concrete provisioners for different infrastructure types:

```go
// provisioners/kubernetes.go
package provisioners

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/yourorg/devportal/models"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
)

// KubernetesProvisioner handles Kubernetes resource provisioning
type KubernetesProvisioner struct {
	clientset *kubernetes.Clientset
}

// NewKubernetesProvisioner creates a new Kubernetes provisioner
func NewKubernetesProvisioner(config *rest.Config) (*KubernetesProvisioner, error) {
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	return &KubernetesProvisioner{
		clientset: clientset,
	}, nil
}

// Provision creates Kubernetes resources
func (p *KubernetesProvisioner) Provision(req models.ProvisionRequest) (*models.ProvisionResult, error) {
	// Extract parameters
	var params struct {
		Namespace   string            `json:"namespace"`
		Name        string            `json:"name"`
		Image       string            `json:"image"`
		Replicas    int32             `json:"replicas"`
		Ports       []int32           `json:"ports"`
		Environment map[string]string `json:"environment"`
	}

	if err := json.Unmarshal(req.Parameters, &params); err != nil {
		return nil, fmt.Errorf("invalid parameters: %v", err)
	}

	// Validate parameters
	if params.Namespace == "" || params.Name == "" || params.Image == "" {
		return nil, fmt.Errorf("namespace, name and image are required")
	}

	// Implementation of Kubernetes resource creation
	// (simplified for brevity)
	// In a real implementation, you would:
	// - Create a deployment
	// - Create a service
	// - Wait for resources to be ready
	// - Return connection details

	// Return result
	return &models.ProvisionResult{
		ResourceID: fmt.Sprintf("%s/%s", params.Namespace, params.Name),
		Outputs: map[string]string{
			"url": fmt.Sprintf("http://%s.%s.svc.cluster.local", params.Name, params.Namespace),
		},
	}, nil
}

// Other required methods implemented similarly...
```

### **27.2.5 Authentication and Authorization**

Security is critical for a developer portal. Let's implement JWT-based authentication and RBAC:

```go
// auth/middleware.go
package auth

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/dgrijalva/jwt-go"
	"github.com/yourorg/devportal/models"
)

// JWTMiddleware validates JWT tokens and adds the user to the request context
func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip auth for health check and public endpoints
		if r.URL.Path == "/health" || strings.HasPrefix(r.URL.Path, "/public") {
			next.ServeHTTP(w, r)
			return
		}

		// Extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Parse and validate token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}

			// Return the secret key used for signing
			return []byte(getJWTSecret()), nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			return
		}

		// Get user from database
		userID, ok := claims["sub"].(string)
		if !ok {
			http.Error(w, "Invalid user ID in token", http.StatusUnauthorized)
			return
		}

		user, err := models.GetUserByID(userID)
		if err != nil {
			http.Error(w, "User not found", http.StatusUnauthorized)
			return
		}

		// Add user to request context
		ctx := context.WithValue(r.Context(), "user", user)

		// Check authorization for the requested resource
		if !authorized(user, r.Method, r.URL.Path) {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		// Call the next handler with the updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// authorized checks if a user has permission for the requested action
func authorized(user models.User, method, path string) bool {
	// Implementation of RBAC logic
	// This would typically check against a permission model in your database
	// Simplified for brevity
	return true
}

// getJWTSecret returns the secret key for JWT signing
func getJWTSecret() string {
	// In production, this would come from a secure configuration or vault
	return "your-secret-key"
}
```

## **27.3 Creating a Service Catalog**

A service catalog is the heart of a developer platform, providing a curated set of services, templates, and resources that developers can consume. Building a well-designed service catalog in Go enables you to create a standardized yet flexible experience.

### **27.3.1 Designing a Service Catalog Model**

Let's define the core models for our service catalog:

```go
// models/catalog.go
package models

import (
	"encoding/json"
	"fmt"
	"time"
)

// ServiceDefinition represents a service template in the catalog
type ServiceDefinition struct {
	ID           string            `json:"id"`
	Name         string            `json:"name"`
	Description  string            `json:"description"`
	Version      string            `json:"version"`
	Type         string            `json:"type"`
	Category     string            `json:"category"`
	Tags         []string          `json:"tags"`
	Icon         string            `json:"icon"`
	Documentation string           `json:"documentation"`
	Parameters   []ParameterDefinition `json:"parameters"`
	Outputs      []OutputDefinition    `json:"outputs"`
	Metadata     map[string]string     `json:"metadata"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
}

// ParameterDefinition describes an input parameter for a service
type ParameterDefinition struct {
	Name         string        `json:"name"`
	DisplayName  string        `json:"display_name"`
	Description  string        `json:"description"`
	Type         string        `json:"type"` // string, number, boolean, object, array
	Default      interface{}   `json:"default,omitempty"`
	Required     bool          `json:"required"`
	Validation   *Validation   `json:"validation,omitempty"`
	Options      []Option      `json:"options,omitempty"` // For select/dropdown parameters
	Conditional  *Conditional  `json:"conditional,omitempty"` // Show parameter based on other values
}

// OutputDefinition describes a service output
type OutputDefinition struct {
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
	Description string `json:"description"`
	Type        string `json:"type"`
	Sensitive   bool   `json:"sensitive,omitempty"`
}

// Validation defines rules for parameter validation
type Validation struct {
	Pattern    string      `json:"pattern,omitempty"`    // Regex pattern
	Min        *float64    `json:"min,omitempty"`        // Min value for numbers
	Max        *float64    `json:"max,omitempty"`        // Max value for numbers
	MinLength  *int        `json:"min_length,omitempty"` // Min length for strings
	MaxLength  *int        `json:"max_length,omitempty"` // Max length for strings
	Format     string      `json:"format,omitempty"`     // Predefined formats like email, uri, etc.
	Enum       []string    `json:"enum,omitempty"`       // Valid values
}

// Option represents a predefined option for select parameters
type Option struct {
	Value       string `json:"value"`
	DisplayName string `json:"display_name"`
	Description string `json:"description,omitempty"`
}

// Conditional defines when a parameter should be shown
type Conditional struct {
	FieldName  string      `json:"field_name"`
	Operator   string      `json:"operator"`   // equals, not_equals, contains, etc.
	Value      interface{} `json:"value"`
}

// ProvisionRequest represents a request to provision a service
type ProvisionRequest struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	ServiceID   string          `json:"service_id"`
	Version     string          `json:"version"`
	Environment string          `json:"environment"`
	Parameters  json.RawMessage `json:"parameters"`
}

// Validate validates the provision request
func (r *ProvisionRequest) Validate() error {
	if r.Name == "" {
		return fmt.Errorf("name is required")
	}
	if r.ServiceID == "" {
		return fmt.Errorf("service_id is required")
	}
	if r.Environment == "" {
		return fmt.Errorf("environment is required")
	}
	if len(r.Parameters) == 0 {
		return fmt.Errorf("parameters are required")
	}
	return nil
}

// ProvisionResult contains the result of a provisioning operation
type ProvisionResult struct {
	ResourceID string            `json:"resource_id"`
	Outputs    map[string]string `json:"outputs"`
}

// ResourceStatus represents the status of a provisioned resource
type ResourceStatus string

const (
	StatusPending    ResourceStatus = "pending"
	StatusInProgress ResourceStatus = "in_progress"
	StatusCompleted  ResourceStatus = "completed"
	StatusFailed     ResourceStatus = "failed"
)
```

### **27.3.2 Implementing Catalog Storage**

We need a storage backend to manage our service catalog. Let's implement a PostgreSQL-based storage:

```go
// storage/catalog.go
package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/yourorg/devportal/models"
)

// CatalogRepository handles service catalog data access
type CatalogRepository struct {
	db *sql.DB
}

// NewCatalogRepository creates a new catalog repository
func NewCatalogRepository(db *sql.DB) *CatalogRepository {
	return &CatalogRepository{db: db}
}

// GetServiceByID retrieves a service definition by ID
func (r *CatalogRepository) GetServiceByID(ctx context.Context, id string) (*models.ServiceDefinition, error) {
	query := `
		SELECT id, name, description, version, type, category,
		       tags, icon, documentation, parameters, outputs, metadata,
		       created_at, updated_at
		FROM service_definitions
		WHERE id = $1
	`

	var service models.ServiceDefinition
	var tagsJSON, paramsJSON, outputsJSON, metadataJSON []byte

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&service.ID,
		&service.Name,
		&service.Description,
		&service.Version,
		&service.Type,
		&service.Category,
		&tagsJSON,
		&service.Icon,
		&service.Documentation,
		&paramsJSON,
		&outputsJSON,
		&metadataJSON,
		&service.CreatedAt,
		&service.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("service not found: %s", id)
		}
		return nil, err
	}

	// Parse JSON fields
	if err := json.Unmarshal(tagsJSON, &service.Tags); err != nil {
		return nil, err
	}

	if err := json.Unmarshal(paramsJSON, &service.Parameters); err != nil {
		return nil, err
	}

	if err := json.Unmarshal(outputsJSON, &service.Outputs); err != nil {
		return nil, err
	}

	if err := json.Unmarshal(metadataJSON, &service.Metadata); err != nil {
		return nil, err
	}

	return &service, nil
}

// ListServices retrieves services with optional filtering
func (r *CatalogRepository) ListServices(ctx context.Context, category string, tags []string) ([]*models.ServiceDefinition, error) {
	query := `
		SELECT id, name, description, version, type, category,
		       tags, icon, documentation, parameters, outputs, metadata,
		       created_at, updated_at
		FROM service_definitions
		WHERE ($1 = '' OR category = $1)
		ORDER BY name
	`

	rows, err := r.db.QueryContext(ctx, query, category)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var services []*models.ServiceDefinition

	for rows.Next() {
		var service models.ServiceDefinition
		var tagsJSON, paramsJSON, outputsJSON, metadataJSON []byte

		err := rows.Scan(
			&service.ID,
			&service.Name,
			&service.Description,
			&service.Version,
			&service.Type,
			&service.Category,
			&tagsJSON,
			&service.Icon,
			&service.Documentation,
			&paramsJSON,
			&outputsJSON,
			&metadataJSON,
			&service.CreatedAt,
			&service.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		// Parse JSON fields
		if err := json.Unmarshal(tagsJSON, &service.Tags); err != nil {
			return nil, err
		}

		// Filter by tags if specified
		if len(tags) > 0 {
			matches := false
			for _, serviceTag := range service.Tags {
				for _, filterTag := range tags {
					if serviceTag == filterTag {
						matches = true
						break
					}
				}
				if matches {
					break
				}
			}
			if !matches {
				continue
			}
		}

		if err := json.Unmarshal(paramsJSON, &service.Parameters); err != nil {
			return nil, err
		}

		if err := json.Unmarshal(outputsJSON, &service.Outputs); err != nil {
			return nil, err
		}

		if err := json.Unmarshal(metadataJSON, &service.Metadata); err != nil {
			return nil, err
		}

		services = append(services, &service)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return services, nil
}

// CreateService adds a new service definition to the catalog
func (r *CatalogRepository) CreateService(ctx context.Context, service *models.ServiceDefinition) error {
	// Set timestamps
	now := time.Now()
	service.CreatedAt = now
	service.UpdatedAt = now

	// Marshal JSON fields
	tagsJSON, err := json.Marshal(service.Tags)
	if err != nil {
		return err
	}

	paramsJSON, err := json.Marshal(service.Parameters)
	if err != nil {
		return err
	}

	outputsJSON, err := json.Marshal(service.Outputs)
	if err != nil {
		return err
	}

	metadataJSON, err := json.Marshal(service.Metadata)
	if err != nil {
		return err
	}

	query := `
		INSERT INTO service_definitions (
			id, name, description, version, type, category,
			tags, icon, documentation, parameters, outputs, metadata,
			created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`

	_, err = r.db.ExecContext(ctx, query,
		service.ID,
		service.Name,
		service.Description,
		service.Version,
		service.Type,
		service.Category,
		tagsJSON,
		service.Icon,
		service.Documentation,
		paramsJSON,
		outputsJSON,
		metadataJSON,
		service.CreatedAt,
		service.UpdatedAt,
	)

	return err
}

// Additional methods for updating, deleting services...
```

### **27.3.3 Creating Service Templates**

Now, let's create a sample service template for a web application:

```go
// templates/webapp.go
package templates

import (
	"github.com/google/uuid"
	"github.com/yourorg/devportal/models"
)

// CreateWebAppTemplate creates a template for deploying web applications
func CreateWebAppTemplate() *models.ServiceDefinition {
	// Define parameters with validation
	parameters := []models.ParameterDefinition{
		{
			Name:        "name",
			DisplayName: "Application Name",
			Description: "Name of your web application (lowercase, no spaces)",
			Type:        "string",
			Required:    true,
			Validation: &models.Validation{
				Pattern:   "^[a-z0-9]([-a-z0-9]*[a-z0-9])?$",
				MinLength: intPtr(3),
				MaxLength: intPtr(63),
			},
		},
		{
			Name:        "image",
			DisplayName: "Container Image",
			Description: "Docker image for your application",
			Type:        "string",
			Required:    true,
		},
		{
			Name:        "replicas",
			DisplayName: "Replicas",
			Description: "Number of application instances",
			Type:        "number",
			Default:     2,
			Validation: &models.Validation{
				Min: float64Ptr(1),
				Max: float64Ptr(10),
			},
		},
		{
			Name:        "port",
			DisplayName: "Container Port",
			Description: "Port your application listens on",
			Type:        "number",
			Default:     8080,
			Validation: &models.Validation{
				Min: float64Ptr(1),
				Max: float64Ptr(65535),
			},
		},
		{
			Name:        "environment",
			DisplayName: "Environment Variables",
			Description: "Key-value pairs for container environment variables",
			Type:        "object",
			Default:     map[string]string{},
		},
		{
			Name:        "resources",
			DisplayName: "Resource Requirements",
			Description: "CPU and memory resources",
			Type:        "object",
			Default: map[string]interface{}{
				"cpu":    "100m",
				"memory": "128Mi",
			},
		},
		{
			Name:        "expose",
			DisplayName: "Expose Service",
			Description: "Whether to expose the service externally",
			Type:        "boolean",
			Default:     true,
		},
		{
			Name:        "route_type",
			DisplayName: "Routing Type",
			Description: "How to expose the service externally",
			Type:        "string",
			Default:     "ClusterIP",
			Options: []models.Option{
				{Value: "ClusterIP", DisplayName: "Internal Only"},
				{Value: "LoadBalancer", DisplayName: "Load Balancer"},
				{Value: "Ingress", DisplayName: "Ingress with DNS"},
			},
			Conditional: &models.Conditional{
				FieldName: "expose",
				Operator:  "equals",
				Value:     true,
			},
		},
	}

	// Define outputs
	outputs := []models.OutputDefinition{
		{
			Name:        "url",
			DisplayName: "Application URL",
			Description: "URL to access your application",
			Type:        "string",
		},
		{
			Name:        "status",
			DisplayName: "Deployment Status",
			Description: "Current status of your deployment",
			Type:        "string",
		},
	}

	// Create service definition
	return &models.ServiceDefinition{
		ID:            uuid.New().String(),
		Name:          "Web Application",
		Description:   "Deploy a containerized web application on Kubernetes",
		Version:       "1.0.0",
		Type:          "kubernetes",
		Category:      "Applications",
		Tags:          []string{"web", "container", "kubernetes"},
		Icon:          "web-app-icon.svg",
		Documentation: "# Web Application\n\nThis template deploys a containerized web application on Kubernetes...",
		Parameters:    parameters,
		Outputs:       outputs,
		Metadata: map[string]string{
			"provisioner": "kubernetes",
			"complexity":  "medium",
			"cost_tier":   "standard",
		},
	}
}

// Helper functions for pointer types
func intPtr(i int) *int {
	return &i
}

func float64Ptr(f float64) *float64 {
	return &f
}
```

### **27.3.4 Creating a Dynamic Form Generator**

One of the most useful features of a service catalog is dynamically generating forms based on service templates. Let's implement a form generator in Go:

```go
// ui/formgenerator.go
package ui

import (
	"encoding/json"

	"github.com/yourorg/devportal/models"
)

// FormDefinition represents a dynamic form for a service
type FormDefinition struct {
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Fields      []FormField  `json:"fields"`
}

// FormField represents a field in a dynamic form
type FormField struct {
	ID          string      `json:"id"`
	Type        string      `json:"type"`
	Label       string      `json:"label"`
	Description string      `json:"description"`
	Required    bool        `json:"required"`
	Default     interface{} `json:"default,omitempty"`
	Validation  interface{} `json:"validation,omitempty"`
	Options     interface{} `json:"options,omitempty"`
	Condition   interface{} `json:"condition,omitempty"`
}

// GenerateFormDefinition creates a form definition from a service template
func GenerateFormDefinition(service *models.ServiceDefinition) *FormDefinition {
	form := &FormDefinition{
		Title:       service.Name,
		Description: service.Description,
		Fields:      make([]FormField, 0, len(service.Parameters)),
	}

	// Add standard name field
	form.Fields = append(form.Fields, FormField{
		ID:          "resource_name",
		Type:        "string",
		Label:       "Resource Name",
		Description: "Name for this resource instance",
		Required:    true,
		Validation: map[string]interface{}{
			"pattern":    "^[a-z0-9]([-a-z0-9]*[a-z0-9])?$",
			"minLength":  3,
			"maxLength":  63,
		},
	})

	// Convert service parameters to form fields
	for _, param := range service.Parameters {
		field := FormField{
			ID:          param.Name,
			Type:        param.Type,
			Label:       param.DisplayName,
			Description: param.Description,
			Required:    param.Required,
			Default:     param.Default,
		}

		// Convert validation
		if param.Validation != nil {
			validationJSON, _ := json.Marshal(param.Validation)
			json.Unmarshal(validationJSON, &field.Validation)
		}

		// Convert options
		if len(param.Options) > 0 {
			optionsJSON, _ := json.Marshal(param.Options)
			json.Unmarshal(optionsJSON, &field.Options)
		}

		// Convert conditional
		if param.Conditional != nil {
			conditionJSON, _ := json.Marshal(param.Conditional)
			json.Unmarshal(conditionJSON, &field.Condition)
		}

		form.Fields = append(form.Fields, field)
	}

	return form
}

// GenerateFormJSON returns the form definition as JSON
func GenerateFormJSON(service *models.ServiceDefinition) ([]byte, error) {
	form := GenerateFormDefinition(service)
	return json.Marshal(form)
}
```

### **27.3.5 Versioning and Managing Service Catalog Changes**

It's important to handle versioning of service templates properly. Let's implement a version management system:

```go
// versioning/service_versions.go
package versioning

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/yourorg/devportal/models"
)

// ServiceVersionRepository manages service template versions
type ServiceVersionRepository struct {
	db *sql.DB
}

// NewServiceVersionRepository creates a new service version repository
func NewServiceVersionRepository(db *sql.DB) *ServiceVersionRepository {
	return &ServiceVersionRepository{db: db}
}

// PublishNewVersion publishes a new version of a service
func (r *ServiceVersionRepository) PublishNewVersion(ctx context.Context, service *models.ServiceDefinition) error {
	// Check if service already exists
	existing, err := r.GetLatestServiceVersion(ctx, service.Name)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	// If service exists, increment version
	if existing != nil {
		// Parse current version and increment
		newVersion, err := IncrementVersion(existing.Version)
		if err != nil {
			return err
		}
		service.Version = newVersion
	}

	// Save new version (implemented in storage repository)
	// This is a simplified example
	return nil
}

// GetLatestServiceVersion gets the latest version of a service
func (r *ServiceVersionRepository) GetLatestServiceVersion(ctx context.Context, serviceName string) (*models.ServiceDefinition, error) {
	query := `
		SELECT id, name, description, version, type, category,
		       tags, icon, documentation, parameters, outputs, metadata,
		       created_at, updated_at
		FROM service_definitions
		WHERE name = $1
		ORDER BY created_at DESC
		LIMIT 1
	`

	// Implementation would be similar to GetServiceByID
	// Simplified for brevity
	return nil, nil
}

// GetServiceVersion gets a specific version of a service
func (r *ServiceVersionRepository) GetServiceVersion(ctx context.Context, serviceName, version string) (*models.ServiceDefinition, error) {
	query := `
		SELECT id, name, description, version, type, category,
		       tags, icon, documentation, parameters, outputs, metadata,
		       created_at, updated_at
		FROM service_definitions
		WHERE name = $1 AND version = $2
	`

	// Implementation would be similar to GetServiceByID
	// Simplified for brevity
	return nil, nil
}

// ListServiceVersions lists all versions of a service
func (r *ServiceVersionRepository) ListServiceVersions(ctx context.Context, serviceName string) ([]*models.ServiceDefinition, error) {
	query := `
		SELECT id, name, description, version, type, category,
		       tags, icon, documentation, parameters, outputs, metadata,
		       created_at, updated_at
		FROM service_definitions
		WHERE name = $1
		ORDER BY created_at DESC
	`

	// Implementation would be similar to ListServices
	// Simplified for brevity
	return nil, nil
}

// IncrementVersion increments the version string (e.g., 1.0.0 -> 1.0.1)
func IncrementVersion(version string) (string, error) {
	// Implementation for semantic versioning
	// Simplified for brevity
	return "1.0.1", nil
}
```

## **27.4 Infrastructure Automation with Go**

Infrastructure automation is a core component of platform engineering, enabling self-service provisioning and management of resources. Go is exceptionally well-suited for building infrastructure automation tools due to its performance, strong typing, and excellent support for cloud provider APIs.

### **27.4.1 Building a Universal Infrastructure Client**

Let's design a flexible infrastructure client that can work with multiple cloud providers:

```go
// infra/client.go
package infra

import (
	"context"
	"fmt"
)

// ResourceType represents a type of infrastructure resource
type ResourceType string

const (
	ResourceTypeVM         ResourceType = "vm"
	ResourceTypeDatabase   ResourceType = "database"
	ResourceTypeStorage    ResourceType = "storage"
	ResourceTypeKubernetes ResourceType = "kubernetes"
	ResourceTypeNetwork    ResourceType = "network"
)

// Resource represents an infrastructure resource
type Resource struct {
	ID           string                 `json:"id"`
	Name         string                 `json:"name"`
	Type         ResourceType           `json:"type"`
	Provider     string                 `json:"provider"`
	Region       string                 `json:"region"`
	Status       string                 `json:"status"`
	CreatedAt    string                 `json:"created_at"`
	Tags         map[string]string      `json:"tags"`
	Properties   map[string]interface{} `json:"properties"`
	Dependencies []string               `json:"dependencies,omitempty"`
}

// Provider defines the interface for infrastructure providers
type Provider interface {
	// Resource operations
	CreateResource(ctx context.Context, resourceType ResourceType, params map[string]interface{}) (*Resource, error)
	GetResource(ctx context.Context, id string) (*Resource, error)
	UpdateResource(ctx context.Context, id string, params map[string]interface{}) (*Resource, error)
	DeleteResource(ctx context.Context, id string) error
	ListResources(ctx context.Context, resourceType ResourceType, filters map[string]string) ([]*Resource, error)

	// Provider information
	GetProviderName() string
	GetRegions() []string
	GetResourceTypes() []ResourceType
	GetTemplates(resourceType ResourceType) ([]map[string]interface{}, error)
}

// Client provides a unified interface to multiple infrastructure providers
type Client struct {
	providers map[string]Provider
}

// NewClient creates a new infrastructure client
func NewClient() *Client {
	return &Client{
		providers: make(map[string]Provider),
	}
}

// RegisterProvider adds a provider to the client
func (c *Client) RegisterProvider(provider Provider) {
	c.providers[provider.GetProviderName()] = provider
}

// GetProvider returns a provider by name
func (c *Client) GetProvider(name string) (Provider, error) {
	provider, exists := c.providers[name]
	if !exists {
		return nil, fmt.Errorf("provider not found: %s", name)
	}
	return provider, nil
}

// CreateResource creates a resource using the specified provider
func (c *Client) CreateResource(ctx context.Context, providerName string, resourceType ResourceType, params map[string]interface{}) (*Resource, error) {
	provider, err := c.GetProvider(providerName)
	if err != nil {
		return nil, err
	}
	return provider.CreateResource(ctx, resourceType, params)
}

// Additional methods for other resource operations...
```

### **27.4.2 Implementing Cloud Provider Adapters**

With our interface defined, let's implement adapters for different cloud providers:

```go
// infra/aws/provider.go
package aws

import (
	"context"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	"github.com/yourorg/devportal/infra"
)

// AWSProvider implements the Provider interface for AWS
type AWSProvider struct {
	config  aws.Config
	ec2Svc  *ec2.Client
	rdsSvc  *rds.Client
	s3Svc   *s3.Client
}

// NewAWSProvider creates a new AWS provider
func NewAWSProvider(ctx context.Context) (*AWSProvider, error) {
	// Load AWS configuration
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to load AWS config: %v", err)
	}

	// Create service clients
	return &AWSProvider{
		config:  cfg,
		ec2Svc:  ec2.NewFromConfig(cfg),
		rdsSvc:  rds.NewFromConfig(cfg),
		s3Svc:   s3.NewFromConfig(cfg),
	}, nil
}

// GetProviderName returns the provider name
func (p *AWSProvider) GetProviderName() string {
	return "aws"
}

// GetRegions returns available AWS regions
func (p *AWSProvider) GetRegions() []string {
	// Return a list of AWS regions
	return []string{
		"us-east-1",
		"us-east-2",
		"us-west-1",
		"us-west-2",
		"eu-west-1",
		"eu-central-1",
		"ap-northeast-1",
		"ap-southeast-1",
		"ap-southeast-2",
	}
}

// GetResourceTypes returns supported resource types
func (p *AWSProvider) GetResourceTypes() []infra.ResourceType {
	return []infra.ResourceType{
		infra.ResourceTypeVM,
		infra.ResourceTypeDatabase,
		infra.ResourceTypeStorage,
		infra.ResourceTypeNetwork,
	}
}

// CreateResource creates a resource in AWS
func (p *AWSProvider) CreateResource(ctx context.Context, resourceType infra.ResourceType, params map[string]interface{}) (*infra.Resource, error) {
	switch resourceType {
	case infra.ResourceTypeVM:
		return p.createEC2Instance(ctx, params)
	case infra.ResourceTypeDatabase:
		return p.createRDSInstance(ctx, params)
	case infra.ResourceTypeStorage:
		return p.createS3Bucket(ctx, params)
	case infra.ResourceTypeNetwork:
		return p.createVPC(ctx, params)
	default:
		return nil, fmt.Errorf("unsupported resource type: %s", resourceType)
	}
}

// Implementation of specific resource creation methods
func (p *AWSProvider) createEC2Instance(ctx context.Context, params map[string]interface{}) (*infra.Resource, error) {
	// Extract parameters
	instanceType, _ := params["instance_type"].(string)
	if instanceType == "" {
		instanceType = "t2.micro" // Default
	}

	ami, _ := params["ami"].(string)
	if ami == "" {
		ami = "ami-0c55b159cbfafe1f0" // Default Amazon Linux 2 AMI
	}

	// Create EC2 instance
	// This is simplified - a real implementation would do much more
	input := &ec2.RunInstancesInput{
		ImageId:      aws.String(ami),
		InstanceType: ec2.InstanceType(instanceType),
		MinCount:     aws.Int32(1),
		MaxCount:     aws.Int32(1),
	}

	result, err := p.ec2Svc.RunInstances(ctx, input)
	if err != nil {
		return nil, fmt.Errorf("failed to create EC2 instance: %v", err)
	}

	// Get the instance ID
	if len(result.Instances) == 0 {
		return nil, fmt.Errorf("no instances created")
	}

	instanceID := *result.Instances[0].InstanceId

	// Create resource object
	resource := &infra.Resource{
		ID:       instanceID,
		Name:     params["name"].(string),
		Type:     infra.ResourceTypeVM,
		Provider: "aws",
		Region:   p.config.Region,
		Status:   "pending",
		Tags:     make(map[string]string),
		Properties: map[string]interface{}{
			"instance_type": instanceType,
			"ami":           ami,
		},
	}

	// Add tags if provided
	if tags, ok := params["tags"].(map[string]string); ok {
		resource.Tags = tags
	}

	return resource, nil
}

// Additional resource creation methods similarly implemented...
```

### **27.4.3 Implementing Infrastructure as Code with Go**

Beyond direct API calls, let's implement a declarative infrastructure as code approach:

```go
// iac/definition.go
package iac

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/yourorg/devportal/infra"
)

// ResourceDefinition defines a resource in an IaC template
type ResourceDefinition struct {
	Name         string                 `json:"name"`
	Type         infra.ResourceType     `json:"type"`
	Provider     string                 `json:"provider"`
	Region       string                 `json:"region"`
	Properties   map[string]interface{} `json:"properties"`
	Tags         map[string]string      `json:"tags,omitempty"`
	Dependencies []string               `json:"depends_on,omitempty"`
}

// Template represents an infrastructure template
type Template struct {
	Name        string               `json:"name"`
	Description string               `json:"description"`
	Version     string               `json:"version"`
	Resources   []ResourceDefinition `json:"resources"`
	Outputs     map[string]string    `json:"outputs,omitempty"`
	Variables   map[string]Variable  `json:"variables,omitempty"`
}

// Variable represents a template variable
type Variable struct {
	Description string      `json:"description"`
	Type        string      `json:"type"`
	Default     interface{} `json:"default,omitempty"`
	Required    bool        `json:"required"`
}

// Deployer handles deployment of infrastructure templates
type Deployer struct {
	client *infra.Client
}

// NewDeployer creates a new infrastructure deployer
func NewDeployer(client *infra.Client) *Deployer {
	return &Deployer{
		client: client,
	}
}

// LoadTemplate loads a template from a file
func (d *Deployer) LoadTemplate(path string) (*Template, error) {
	// Read template file
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read template: %v", err)
	}

	// Parse template
	var template Template
	if err := json.Unmarshal(data, &template); err != nil {
		return nil, fmt.Errorf("failed to parse template: %v", err)
	}

	return &template, nil
}

// Deploy deploys a template with variable values
func (d *Deployer) Deploy(ctx context.Context, template *Template, variables map[string]interface{}) (map[string]interface{}, error) {
	// Validate variables
	if err := d.validateVariables(template, variables); err != nil {
		return nil, err
	}

	// Build dependency graph
	graph := buildDependencyGraph(template.Resources)

	// Deploy resources in dependency order
	resources := make(map[string]*infra.Resource)
	outputs := make(map[string]interface{})

	// Process resources in dependency order
	for _, resourceName := range graph.GetDeploymentOrder() {
		resourceDef := getResourceByName(template.Resources, resourceName)
		if resourceDef == nil {
			return nil, fmt.Errorf("resource not found: %s", resourceName)
		}

		// Resolve dependencies and variable references
		resolvedProps, err := d.resolveProperties(resourceDef.Properties, variables, resources)
		if err != nil {
			return nil, err
		}

		// Create resource
		resource, err := d.client.CreateResource(
			ctx,
			resourceDef.Provider,
			resourceDef.Type,
			resolvedProps,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to create resource %s: %v", resourceName, err)
		}

		// Store resource for dependency resolution
		resources[resourceName] = resource

		// Map outputs
		for outputName, outputPath := range template.Outputs {
			value, err := resolveOutputValue(outputPath, resources)
			if err != nil {
				return nil, err
			}
			outputs[outputName] = value
		}
	}

	return outputs, nil
}

// Helper methods for dependency resolution, validation, etc.
func (d *Deployer) validateVariables(template *Template, variables map[string]interface{}) error {
	// Check that all required variables are provided
	for name, varDef := range template.Variables {
		if varDef.Required {
			if _, exists := variables[name]; !exists {
				return fmt.Errorf("required variable not provided: %s", name)
			}
		}
	}
	return nil
}

func (d *Deployer) resolveProperties(properties map[string]interface{}, variables map[string]interface{}, resources map[string]*infra.Resource) (map[string]interface{}, error) {
	// Deep copy properties to avoid modifying the original
	resolved := make(map[string]interface{})
	for k, v := range properties {
		resolved[k] = v
	}

	// Resolve variable references
	// This is a simplified implementation - a real one would handle nested properties
	for key, value := range resolved {
		if strValue, ok := value.(string); ok {
			// Check if it's a variable reference
			if len(strValue) > 3 && strValue[:2] == "${" && strValue[len(strValue)-1:] == "}" {
				// Extract variable name
				varName := strValue[2 : len(strValue)-1]

				// Check if it's a reference to a resource property
				if resourceRef, ok := resources[varName]; ok {
					resolved[key] = resourceRef.ID
				} else if varValue, ok := variables[varName]; ok {
					// It's a variable reference
					resolved[key] = varValue
				} else {
					return nil, fmt.Errorf("undefined reference: %s", varName)
				}
			}
		}
	}

	return resolved, nil
}

// Additional helper methods...
```

### **27.4.4 Creating a Terraform-like State Manager**

To track infrastructure state, let's implement a state manager:

```go
// iac/state.go
package iac

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/yourorg/devportal/infra"
)

// State represents the current state of deployed infrastructure
type State struct {
	Version     int                    `json:"version"`
	StackName   string                 `json:"stack_name"`
	Resources   map[string]*infra.Resource `json:"resources"`
	Outputs     map[string]interface{} `json:"outputs"`
	LastUpdated time.Time              `json:"last_updated"`
}

// StateManager handles the persistence and retrieval of infrastructure state
type StateManager struct {
	stateDir string
	mutex    sync.Mutex
}

// NewStateManager creates a new state manager
func NewStateManager(stateDir string) (*StateManager, error) {
	// Create state directory if it doesn't exist
	if err := os.MkdirAll(stateDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create state directory: %v", err)
	}

	return &StateManager{
		stateDir: stateDir,
	}, nil
}

// GetState retrieves the state for a stack
func (m *StateManager) GetState(stackName string) (*State, error) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	// Build state file path
	statePath := filepath.Join(m.stateDir, fmt.Sprintf("%s.json", stackName))

	// Check if state file exists
	if _, err := os.Stat(statePath); os.IsNotExist(err) {
		// No state file, return empty state
		return &State{
			Version:     1,
			StackName:   stackName,
			Resources:   make(map[string]*infra.Resource),
			Outputs:     make(map[string]interface{}),
			LastUpdated: time.Now(),
		}, nil
	}

	// Read state file
	data, err := ioutil.ReadFile(statePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read state file: %v", err)
	}

	// Parse state
	var state State
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, fmt.Errorf("failed to parse state: %v", err)
	}

	return &state, nil
}

// SaveState saves the state for a stack
func (m *StateManager) SaveState(state *State) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	// Update timestamp
	state.LastUpdated = time.Now()

	// Build state file path
	statePath := filepath.Join(m.stateDir, fmt.Sprintf("%s.json", state.StackName))

	// Marshal state to JSON
	data, err := json.MarshalIndent(state, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal state: %v", err)
	}

	// Write state file
	if err := ioutil.WriteFile(statePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write state file: %v", err)
	}

	return nil
}

// ListStacks returns a list of all stack names
func (m *StateManager) ListStacks() ([]string, error) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	// Read state directory
	files, err := ioutil.ReadDir(m.stateDir)
	if err != nil {
		return nil, fmt.Errorf("failed to read state directory: %v", err)
	}

	// Extract stack names from filenames
	stacks := make([]string, 0, len(files))
	for _, file := range files {
		if !file.IsDir() && filepath.Ext(file.Name()) == ".json" {
			stackName := file.Name()[:len(file.Name())-5] // Remove .json extension
			stacks = append(stacks, stackName)
		}
	}

	return stacks, nil
}
```

## **27.5 Building Platform CLI Tools**

Command-line tools are essential for platform engineers and their developer users. Go excels at creating efficient, cross-platform CLI tools that can be distributed as single binaries. Let's explore how to build effective platform CLI tools in Go.

### **27.5.1 Designing Effective CLI Interfaces**

A well-designed CLI should be intuitive, consistent, and provide appropriate feedback. Let's implement a flexible CLI framework:

```go
// cli/app.go
package cli

import (
	"fmt"
	"os"
	"sort"
	"strings"

	"github.com/fatih/color"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

// App represents the CLI application
type App struct {
	Name        string
	Description string
	Version     string
	RootCmd     *cobra.Command
	Config      *viper.Viper
}

// NewApp creates a new CLI application
func NewApp(name, description, version string) *App {
	app := &App{
		Name:        name,
		Description: description,
		Version:     version,
		Config:      viper.New(),
	}

	// Create root command
	app.RootCmd = &cobra.Command{
		Use:     app.Name,
		Short:   app.Description,
		Version: app.Version,
	}

	// Add global flags
	app.RootCmd.PersistentFlags().StringP("config", "c", "", "config file path")
	app.RootCmd.PersistentFlags().BoolP("verbose", "v", false, "enable verbose output")
	app.RootCmd.PersistentFlags().Bool("no-color", false, "disable colored output")

	// Bind flags to config
	app.Config.BindPFlag("config", app.RootCmd.PersistentFlags().Lookup("config"))
	app.Config.BindPFlag("verbose", app.RootCmd.PersistentFlags().Lookup("verbose"))
	app.Config.BindPFlag("no_color", app.RootCmd.PersistentFlags().Lookup("no-color"))

	// Set up default config locations
	app.Config.SetConfigName(app.Name)
	app.Config.AddConfigPath(".")
	app.Config.AddConfigPath("$HOME/." + app.Name)
	app.Config.AddConfigPath("/etc/" + app.Name)

	return app
}

// Setup initializes the application
func (a *App) Setup() error {
	// Add command execution hooks
	cobra.OnInitialize(func() {
		// Load config
		configPath := a.Config.GetString("config")
		if configPath != "" {
			a.Config.SetConfigFile(configPath)
		}

		if err := a.Config.ReadInConfig(); err != nil {
			if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
				fmt.Fprintf(os.Stderr, "Error reading config: %v\n", err)
			}
		}

		// Configure color output
		if a.Config.GetBool("no_color") {
			color.NoColor = true
		}
	})

	return nil
}

// Run executes the CLI application
func (a *App) Run() error {
	return a.RootCmd.Execute()
}

// AddCommand adds a command to the application
func (a *App) AddCommand(cmd *cobra.Command) {
	a.RootCmd.AddCommand(cmd)
}

// AddCommandGroup adds a group of related commands
func (a *App) AddCommandGroup(groupName string, cmds []*cobra.Command) {
	// Create parent command for the group
	groupCmd := &cobra.Command{
		Use:   strings.ToLower(groupName),
		Short: fmt.Sprintf("%s commands", groupName),
	}

	// Add sub-commands
	for _, cmd := range cmds {
		groupCmd.AddCommand(cmd)
	}

	// Add to root command
	a.RootCmd.AddCommand(groupCmd)
}
```

### **27.5.2 Implementing Common Platform Commands**

Let's implement some common commands for a platform engineering CLI:

```go
// cli/commands/resources.go
package commands

import (
	"fmt"
	"os"
	"text/tabwriter"

	"github.com/spf13/cobra"
	"github.com/yourorg/devportal/client"
)

// NewResourcesCommand creates the resources command group
func NewResourcesCommand(client *client.Client) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "resources",
		Short: "Manage platform resources",
		Long:  "View and manage resources provisioned through the platform",
	}

	// Add sub-commands
	cmd.AddCommand(
		newListResourcesCommand(client),
		newGetResourceCommand(client),
		newDeleteResourceCommand(client),
	)

	return cmd
}

// newListResourcesCommand creates a command to list resources
func newListResourcesCommand(client *client.Client) *cobra.Command {
	var (
		environment string
		resourceType string
		outputFormat string
	)

	cmd := &cobra.Command{
		Use:   "list",
		Short: "List resources",
		RunE: func(cmd *cobra.Command, args []string) error {
			// Get resources from API
			resources, err := client.ListResources(environment, resourceType)
			if err != nil {
				return fmt.Errorf("failed to list resources: %v", err)
			}

			// Format output
			switch outputFormat {
			case "json":
				return outputJSON(resources)
			case "yaml":
				return outputYAML(resources)
			default:
				return outputTable(resources)
			}
		},
	}

	// Add flags
	cmd.Flags().StringVarP(&environment, "environment", "e", "", "filter by environment")
	cmd.Flags().StringVarP(&resourceType, "type", "t", "", "filter by resource type")
	cmd.Flags().StringVarP(&outputFormat, "output", "o", "table", "output format (table, json, yaml)")

	return cmd
}

// outputTable outputs resources in table format
func outputTable(resources []client.Resource) error {
	w := tabwriter.NewWriter(os.Stdout, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "NAME\tTYPE\tENVIRONMENT\tSTATUS\tCREATED")

	for _, r := range resources {
		fmt.Fprintf(w, "%s\t%s\t%s\t%s\t%s\n",
			r.Name,
			r.Type,
			r.Environment,
			r.Status,
			r.CreatedAt.Format("2006-01-02 15:04:05"),
		)
	}

	return w.Flush()
}

// Additional command implementations...
```

### **27.5.3 Creating Interactive CLI Features**
