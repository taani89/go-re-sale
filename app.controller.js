/* global objectId */
angular.module('GoReSale.app.controllers', [])


.controller('AppCtrl', function($scope,$state, AuthService, $rootScope, $ionicHistory, $stateParams) {
  
  if ($stateParams.clear) {
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
    }
    
        $scope.logout = function() {
        Parse.User.logOut();
        $rootScope.user = null;
        $rootScope.isLoggedIn = false;
        $state.go('facebook-sign-in');
    };
      
    
})


.controller('ProfileCtrl', function($scope, $stateParams, PostService, $ionicHistory, $state, $ionicScrollDelegate) {

  $scope.$on('$ionicView.afterEnter', function() {
    $ionicScrollDelegate.$getByHandle('profile-scroll').resize();
  });

  var userId = $stateParams.objectId;

  $scope.myProfile = $scope.loggedUser._id == objectId;
  $scope.posts = [];
  $scope.likes = [];
  $scope.user = {};

  PostService.getUserPosts(userId).then(function(data){
    $scope.posts = data;
  });

  PostService.getUserDetails(userId).then(function(data){
    $scope.user = data;
  });

  PostService.getUserLikes(userId).then(function(data){
    $scope.likes = data;
  });

  $scope.getUserLikes = function(userId){
    //we need to do this in order to prevent the back to change
    $ionicHistory.currentView($ionicHistory.backView());
    $ionicHistory.nextViewOptions({ disableAnimate: true });

    $state.go('app.profile.likes', {userId: userId});
  };

  $scope.getUserPosts = function(userId){
    //we need to do this in order to prevent the back to change
    $ionicHistory.currentView($ionicHistory.backView());
    $ionicHistory.nextViewOptions({ disableAnimate: true });

    $state.go('app.profile.posts', {userId: userId});
  };

})


.controller('ProductCtrl', function($scope, $stateParams, ShopService, $ionicPopup, $ionicLoading) {
  var productId = $stateParams.productId;

  ShopService.getProduct(productId).then(function(product){
    $scope.product = product;
  });

  // show add to cart popup on button click
  $scope.showAddToCartPopup = function(product) {
    $scope.data = {};
    $scope.data.product = product;
    $scope.data.productOption = 1;
    $scope.data.productQuantity = 1;

    var myPopup = $ionicPopup.show({
      cssClass: 'add-to-cart-popup',
      templateUrl: 'views/app/shop/partials/add-to-cart-popup.html',
      title: 'Add to Cart',
      scope: $scope,
      buttons: [
        { text: '', type: 'close-popup ion-ios-close-outline' },
        {
          text: 'Add to cart',
          onTap: function(e) {
            return $scope.data;
          }
        }
      ]
    });
    myPopup.then(function(res) {
      if(res)
      {
        $ionicLoading.show({ template: '<ion-spinner icon="ios"></ion-spinner><p style="margin: 5px 0 0 0;">Adding to cart</p>', duration: 1000 });
        ShopService.addProductToCart(res.product);
        console.log('Item added to cart!', res);
      }
      else {
        console.log('Popup closed');
      }
    });
  };
})


.controller('FeedCtrl', function($scope, PostService) {
  $scope.posts = [];
  $scope.page = 1;
  $scope.totalPages = 1;

  $scope.doRefresh = function() {
    PostService.getFeed(1)
    .then(function(data){
      $scope.totalPages = data.totalPages;
      $scope.posts = data.posts;

      $scope.$broadcast('scroll.refreshComplete');
    });
  };

  $scope.getNewData = function() {
    //do something to load your new data here
    $scope.$broadcast('scroll.refreshComplete');
  };

  $scope.loadMoreData = function(){
    $scope.page += 1;

    PostService.getFeed($scope.page)
    .then(function(data){
      //We will update this value in every request because new posts can be created
      $scope.totalPages = data.totalPages;
      $scope.posts = $scope.posts.concat(data.posts);

      $scope.$broadcast('scroll.infiniteScrollComplete');
    });
  };

  $scope.moreDataCanBeLoaded = function(){
    return $scope.totalPages > $scope.page;
  };

  $scope.doRefresh();

})


.controller('ShopCtrl', function($scope, ShopService) {
  $scope.products = [];
  $scope.popular_products = [];

  ShopService.getProducts().then(function(products){
    $scope.products = products;
  });



  ShopService.getProducts().then(function(products){
    $scope.popular_products = products.slice(0, 2);
  });
})


.controller('ShoppingCartCtrl', function($scope, ShopService, $ionicActionSheet, _) {
  $scope.products = ShopService.getCartProducts();

  $scope.removeProductFromCart = function(product) {
    $ionicActionSheet.show({
      destructiveText: 'Remove from cart',
      cancelText: 'Cancel',
      cancel: function() {
        return true;
      },
      destructiveButtonClicked: function() {
        ShopService.removeProductFromCart(product);
        $scope.products = ShopService.getCartProducts();
        return true;
      }
    });
  };

  $scope.getSubtotal = function() {
    return _.reduce($scope.products, function(memo, product){ return memo + product.price; }, 0);
  };

})


.controller('CheckoutCtrl', function($scope,$state, $rootScope, $stateParams, $ionicHistory, $ionicModal) {
   $scope.data = {};
   
   $scope.shippingAddress = function(){
     
     
     //create user shipping address in parse
     var user = new Parse.Object("Address");
     user.set("fullName",$scope.data.fullName);
     user.set("address1",$scope.data.address1);
     user.set("address2",$scope.data.address2);
     user.set("city",$scope.data.city);
     user.set("state",$scope.data.state);
     user.set("country",$scope.data.country);
     user.set("postalCode",$scope.data.postalCode);
     user.set("phoneNumber",$scope.data.phoneNumber);
     user.set("email",$scope.data.email);
     
    
     user.save({
     success: function(){
       alert("success!Shipping address save.");
       console.log("Submit shipping address");
       $state.go('app.checkout');
     },
     error: function(error) {
      // Show the error message somewhere and let the user try again.
      alert("Error: " + error.code + " " + error.message);
    }
    });
   };
   
   
  
  $ionicModal.fromTemplateUrl('views/app/shop/wire-transfer.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    $scope.wire_transfer_modal = modal;
  });
  
  $ionicModal.fromTemplateUrl('views/app/shop/orderSummary.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal){
    $scope.order_summary_modal = modal;
  });
  
  $scope.showTransfer = function(){
    $scope.wire_transfer_modal.show();
  }
  
   $scope.showSummary = function(){
    $scope.order_summary_modal.show();
  }
  
})


.controller('SettingsCtrl', function($scope,$state,$rootScope, $ionicModal, $ionicHistory) {
  
 $ionicModal.fromTemplateUrl('views/app/profile/product-upload.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.product_upload_modal = modal;
  });
  
  $ionicModal.fromTemplateUrl('views/app/profile/post-topic.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.post_topic_modal = modal;
  });
 
  $ionicModal.fromTemplateUrl('views/app/legal/terms-of-service.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.terms_of_service_modal = modal;
  });

  $ionicModal.fromTemplateUrl('views/app/legal/privacy-policy.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.privacy_policy_modal = modal;
  });

  $ionicModal.fromTemplateUrl('views/app/profile/about-us.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.about_us_modal = modal;
  });

  $scope.uploadProduct = function() {
    $scope.product_upload_modal.show();
  };
  
  
  $scope.postForum = function() {
    $scope.post_topic_modal.show();
  };

  $scope.showTerms = function() {
    $scope.terms_of_service_modal.show();
  };

  $scope.showPrivacyPolicy = function() {
    $scope.privacy_policy_modal.show();
  };
  
  $scope.showAboutUs = function() {
    $scope.about_us_modal.show();
  };

  $scope.postTopic = function(title,content){
    
       $scope.data={
        "title":"",
        "content":""
      };
    
      var Post = new Parse.Object("Forum");
     
      Post.set("title",title);
      Post.set("content",content);
      Post.set( "userId", { "__type": "Pointer", "className": "_User", "objectId": Parse.User.current().id } );
      // create ACL
      var acl = new Parse.ACL();
      // public cannot read data
      acl.setPublicReadAccess(false);
      // user can read data
      acl.setReadAccess( Parse.User.current(), true );
      // save ACL to object
      Post.setACL( acl );
      
      Post.save({
       success: function(Post){
       alert("Forum post created with objectId: " + Post.id);
       console.log("Submit post in forum");
       $state.go('app.feed');
     },
     error:function(Post, error) {
      // Show the error message somewhere and let the user try again.
      alert("Failed to created new post: " + error.code + " " + error.message);
    }
    });
  }
})
  

