terraform {
  required_version = ">= 1.10"

  backend "s3" {
    bucket = "restaurant-terraform-state-427875344082"
    key    = "terraform.tfstate"
    region = "us-west-2"
  }
}
