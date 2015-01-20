'use strict';
(function () {
    angular.module('permission')
        .directive('permission', ['Permission','removeElement', 'hideElement', 'showElement', function (Permission, removeElement, hideElement, showElement) {
            return{
                restrict: 'A',
                link: function (scope, element, attributes) {
                    // chain all promises together
                    // stop resolving r.call() if a r.call() promise returns a permission hash
                    function getPermssions(){
                        var chainedPromises = null;

                        angular.forEach(Permission.roleValidations, function(r){
                            // initialize first promise
                            if( chainedPromises === null) {
                                // r.call() has to returns a promise
                                chainedPromises = r.call();
                            }else {
                                // chain promises together
                                // then method decides upon promise resolution if the next promise should be
                                // resolved or if we are done
                                // this assumes that only one role can be active at a given time, or more precisly:
                                // the first role returning not null will be the role used for permission checking
                                chainedPromises.then(function (permissions) {
                                    if (permissions != null) {
                                        return permissions;
                                    }
                                    else {
                                        // again, r.call() has to return a promise
                                        return r.call();
                                    }
                                })
                            }
                        });

                        return chainedPromises;
                    }

                    getPermssions().then(function(rolePermissions){
                        var elementRemovalMethod = attributes.permissionElementRemoval;
                        var hideMethod = hideElement;
                        var showMethod = showElement;
                        var allowedAccess = attributes.permission.split(":");
                        var modelClass = allowedAccess[0];
                        var modelOperation = allowedAccess[1];
                        var hasAccess = false;

                        if( rolePermissions != null && rolePermissions[modelClass] ){
                            hasAccess = (rolePermissions[modelClass].indexOf(modelOperation) != -1)
                        }

                        if(elementRemovalMethod != null) {
                            // if we want to delete the elements from the DOM we use 'delete'
                            if (elementRemovalMethod == 'delete') {
                                hideMethod = removeElement;
                                showMethod = null;
                            }
                        }

                        if(hasAccess){
                            if (showMethod != null) {
                                angular.forEach(element.children(), function (child) {
                                    showMethod($(child));
                                });
                                showMethod(element);
                            }
                        }
                        else {
                            angular.forEach(element.children(), function (child) {
                                hideMethod($(child));
                            });
                            hideMethod(element);
                        }
                    })
                }
            }
        }]).constant('hideElement', function(element){
            element && element.addClass('ng-hide');
        }).constant('showElement', function(element){
            element && element.removeClass('ng-hide');
        }).constant('removeElement', function(element){
            element && element.remove && element.remove();
        });
}());
