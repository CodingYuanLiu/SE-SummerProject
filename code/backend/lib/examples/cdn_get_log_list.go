package main

import (
	"fmt"
	"os"

	"jing/app/lib/auth"
	"jing/app/lib/cdn"
)

var (
	accessKey = os.Getenv("QINIU_ACCESS_KEY")
	secretKey = os.Getenv("QINIU_SECRET_KEY")
	domain    = os.Getenv("QINIU_TEST_DOMAIN")
)

func main() {
	mac := auth.New(accessKey, secretKey)
	cdnManager := cdn.NewCdnManager(mac)

	domains := []string{
		domain,
	}
	day := "2017-07-30"
	ret, err := cdnManager.GetCdnLogList(day, domains)
	if err != nil {
		fmt.Println(err)
		return
	}
	domainLogs := ret.Data
	for domain, logs := range domainLogs {
		fmt.Println(domain)
		for _, item := range logs {
			fmt.Println(item.Name, item.URL, item.Size, item.ModifiedTime)
		}
	}
}
